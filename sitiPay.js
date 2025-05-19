import fs from 'fs';
import { getCredentials } from './credentials.js';
import { askAmount, askMobile, askSender } from './inputHelper.js';
import { pressAnyKeyToContinue } from './continueHandler.js';
import { closeAll } from './logoutHandler.js';

if (!fs.existsSync('Payment_Screenshots')) {
  fs.mkdirSync('Payment_Screenshots');
}

function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}

function startEightMinuteCountdown() {
  let stop = false;

  const countdown = (async () => {
    const totalSeconds = 8 * 60;
    for (let i = totalSeconds; i > 0; i--) {
      if (stop) break;
      const minutes = Math.floor(i / 60).toString().padStart(2, '0');
      const seconds = (i % 60).toString().padStart(2, '0');
      updateInlineStatus(`⏳ Waiting for payment... ${minutes}:${seconds} remaining`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    updateInlineStatus(''); // Clear line when done or stopped
  })();

  return {
    stop: () => { stop = true; },
    countdown
  };
}

async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`⏳ Waiting for the page to load (${i} seconds)  \r`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  } updateInlineStatus('');
}

async function waitForPreloaderToDisappear(page, timeout = 30000) {
  //await new Promise(resolve => setTimeout(resolve, 500));
  try {
    await page.waitForFunction(() => {
      const spinner = document.querySelector('#form1 > div:nth-child(6) > div > div > i');
      return !spinner || spinner.offsetParent === null || spinner.style.display === 'none';
    }, { timeout });
  } catch (err) {
    console.warn('⚠️ Timeout while waiting for preloader to disappear:', err.message);
  }
}

function getReceiptScreenshotFilename(folder = 'Payment_Screenshots') {
  const cred = getCredentials();
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find(p => p.type === type)?.value || '';

  const date = `${getPart('day')}-${getPart('month')}-${getPart('year')}`;
  const time = `${getPart('hour')}-${getPart('minute')}`;

  return `${folder}/Payment_${cred.label}_${date}_${time}.png`;
}

export default async function addMoney(browser, amt) {
  let loggedIn = false;
  let amount;
  if (!amt)
    amount = await askAmount();
  else
    amount = String(amt);
  let mobile = await askSender();
  if (mobile === 'Other')
    mobile = await askMobile();
  const page2 = await browser.newPage();
  await page2.goto('https://www.sitinetworks.com/LCOLogin.php', { waitUntil: 'domcontentloaded' });
  await waitForPreloaderToDisappear(page2);
  const { userId, password, itzPassword } = getCredentials();
  await page2.type('#ContentPlaceHolder1_txtUserID', userId);
  await page2.type('#ContentPlaceHolder1_txtPassword', password);
  updateInlineStatus(`Logging in...`);
  try {
    await page2.click('#ContentPlaceHolder1_btnLCOLogin');
    await page2.waitForNavigation({ waitUntil: 'networkidle0' });
    loggedIn = true;
    updateInlineStatus('Logged in successfully\n');
    await waitForPreloaderToDisappear(page2);
  } catch (err) {
    console.log('\n❌ Login or navigation failed:', err.message);
  }
  if (loggedIn) {
    await waitForPreloaderToDisappear(page2);
    try {
      await page2.click('#ContentPlaceHolder1_btnProceed');
      await page2.waitForNavigation({ waitUntil: 'networkidle0' });
      await waitForPreloaderToDisappear(page2);
      try {
        await page2.type('#RechargeAmount', amount.toString());
        await page2.click('input[value="Pay"]');
        await page2.waitForNavigation({ waitUntil: 'networkidle0' });
        await waitForPreloaderToDisappear(page2);
        await page2.click('#ContentPlaceHolder1_rbtpaytm');
        await page2.click('#btnConfirm');
        await page2.waitForNavigation({ waitUntil: 'networkidle0' });
        await countdown(5);
        await page2.click('div#checkout-upi input[type="radio"]');
        await countdown(3);
        await page2.waitForSelector('.ptm-upi-input'); // Waits for at least one to appear
        const inputs = await page2.$$('.ptm-upi-input');
        if (inputs.length >= 2) {
          await inputs[1].type(mobile);
        }
        await page2.click('#checkout-button');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('⏳ Request sent! Waiting for payment.');
        // Wait up to 8 minutes for navigation to the thankyou page
        try {
          const countdownController = startEightMinuteCountdown();

          try {
            await page2.waitForNavigation({
              timeout: 8 * 60 * 1000,
              waitUntil: 'domcontentloaded'
            });
          } finally {
            countdownController.stop(); // Always stop the countdown whether success or error
            await countdownController.countdown; // Ensure countdown fully finishes cleanup
          }
          

          const currentUrl = page2.url();

          if (currentUrl.includes('thankyou.php')) {
            const receiptTableExists = await page2.$('#tbl_Receipt') !== null;

            if (receiptTableExists) {
              const receiptElement = await page2.$('#tbl_Receipt');
              try {
                const filename = getReceiptScreenshotFilename();
                await new Promise(resolve => setTimeout(resolve, 500));
                await waitForPreloaderToDisappear(page2);
                await receiptElement.screenshot({ path: filename });
                console.log(`✅ Payment successful - screenshot saved.`);
              } catch (screenshotErr) {
                console.error('❌ Failed to capture screenshot of receipt table:', screenshotErr.message);
              }
            } else {
              console.error('❌ Receipt table not found on thankyou page.');
            }
          } else {
            console.error(`❌ Unexpected URL after payment: ${currentUrl}`);
          }
        } catch (e) {
          console.error('❌ Timeout or error while waiting for thankyou page:', e.message);
        }
        await closeAll(browser);
        await pressAnyKeyToContinue();
      }
      catch (err) {
        console.log('\n❌ Couldn\'t find the amount textbox:', err.message);
      }
    } catch (err) {
      console.log('\n❌ Login or navigation failed:', err.message);
    }
  }
}
