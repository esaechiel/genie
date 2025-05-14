import { getCredentials } from './credentials.js';
import { askAmount,askMobile } from './inputHelper.js';
import { pressAnyKeyToContinue } from './continueHandler.js';

function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}

async function countdown(seconds) {
    for (let i = seconds; i > 0; i--) {
      process.stdout.write(`⏳ Waiting for the page to load (${i} seconds)\r`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    process.stdout.write(`✅ Done!                                              `);
  }
  
export default async function addMoney(browser) {
    let loggedIn = false;
    const amount = await askAmount();
    const mobile = await askMobile();
    const page2 = await browser.newPage();
    await page2.goto('https://www.sitinetworks.com/LCOLogin.php', { waitUntil: 'domcontentloaded' });
    //await page2.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('🟢 Siti Pay Opened');
    const { userId, password, itzPassword } = getCredentials();
    await page2.type('#ContentPlaceHolder1_txtUserID', userId);
    await page2.type('#ContentPlaceHolder1_txtPassword', password);
  
  await countdown(10);

  updateInlineStatus(`Logging in...\n`);
  try {
      await page2.click('#ContentPlaceHolder1_btnLCOLogin');
      await page2.waitForNavigation({ waitUntil: 'networkidle0' });
      loggedIn = true;
      console.log('Logged in successfully\n');
    } catch (err) {
    console.log('\n❌ Login or navigation failed:', err.message);
    }
    if (loggedIn){
      await countdown(5);
      try {
        await page2.click('#ContentPlaceHolder1_btnProceed');
        await page2.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await countdown(5);
        try {
          await page2.type('#RechargeAmount', amount.toString());
          //await page2.waitForSelector('input[value="Pay"]', { visible: true });
          await page2.click('input[value="Pay"]');
          await page2.waitForNavigation({ waitUntil: 'domcontentloaded' });
          await countdown(5);
          //await page2.waitForSelector('#ContentPlaceHolder1_rbtpaytm', { visible: true });
          await page2.click('#ContentPlaceHolder1_rbtpaytm');
          //await page2.waitForSelector('#btnConfirm', { visible: true });
          await page2.click('#btnConfirm');
          await page2.waitForNavigation({ waitUntil: 'domcontentloaded' });
          await countdown(5);
          //await page2.waitForSelector('div#checkout-upi input[type="radio"]', { visible: true });
          await page2.click('div#checkout-upi input[type="radio"]');
          await countdown(3);
          await page2.waitForSelector('.ptm-upi-input'); // Waits for at least one to appear
          const inputs = await page2.$$('.ptm-upi-input');
          if (inputs.length >= 2) {
            await inputs[1].type(mobile);
          }
          await page2.click('#checkout-button');
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Wait up to 8 minutes for navigation to the thankyou page
          try {
            await page2.waitForNavigation({
              timeout: 8 * 60 * 1000, // 8 minutes
              waitUntil: 'domcontentloaded'
            });

            const currentUrl = page2.url();

            if (currentUrl.includes('thankyou.php')) {
              const receiptTableExists = await page2.$('#tbl_Receipt') !== null;

              if (receiptTableExists) {
                const receiptElement = await page2.$('#tbl_Receipt');
                try {
                  await receiptElement.screenshot({ path: 'receipt_table.png' });
                  console.log('🧾 Receipt table found and screenshot saved as "receipt_table.png".');
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
          await pressAnyKeyToContinue();
          /*try {
            await page2.waitForFunction(
              () => {
                const successInUrl = window.location.href.includes('success'); // or 'thankyou', etc.
                const successMessage = document.querySelector('.payment-success-message'); // change selector
                return successInUrl || successMessage;
              },
              { timeout: 8 * 60 * 1000, polling: 1000 } // 8 min max, check every 1s
            );
          
            console.log('✅ Payment successful! Final URL:', page.url());
          } catch (err) {
            console.log('⏰ Timed out after 8 minutes. Payment may not have completed.');
          }*/
        }
        catch (err) {
        console.log('\n❌ Couldn\'t find the amount textbox:', err.message);
        }
      } catch (err) {
        console.log('\n❌ Login or navigation failed:', err.message);
    }
  }
    //await page2.screenshot({ path: 'sitiPayTab_screenshot.png', fullPage: true });
}
