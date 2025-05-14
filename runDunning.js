import { ConsoleMessage } from 'puppeteer';
import { askDaysInput } from './inputHelper.js';
import { getCredentials } from './credentials.js';

function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}

async function selectDayRange(page) {
    const daysToSelect = await askDaysInput();
    await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddlDays', { timeout: 30000 });
    await page.select('#ctl00_ContentPlaceHolder1_ddlDays', `${daysToSelect}`);
    updateInlineStatus('Day range selected\n');
  }
  
async function getRecordCount(page) {
    return await page.$eval('#ctl00_ContentPlaceHolder1_lblcount', el => el.textContent.trim());
}
  
async function clickSearchAndWait(page, oldTotal) {
    updateInlineStatus(`Getting list\n`);
    await page.waitForSelector('#ctl00_ContentPlaceHolder1_btnSearch', { timeout: 3000 });
    await Promise.all([
      page.click('#ctl00_ContentPlaceHolder1_btnSearch'),
      page.waitForFunction(
        (prevVal) => {
          const el = document.querySelector('#ctl00_ContentPlaceHolder1_lblcount');
          return el && el.textContent.trim() !== prevVal;
        },
        { timeout: 15000 },
        oldTotal
      )
    ]);
    const newTotal = await getRecordCount(page);
    console.log(`✅ Number of subscribers - ${newTotal}`);
    return true;
}
  
async function fillAmountsAndCheck(page) {
    updateInlineStatus(`Filling values and checking boxes\n`);
    await page.$$eval('input[id^="ctl00_ContentPlaceHolder1_gvLCOwiseSMS_Invoice_"][id$="_txt_NetInvoice_Amount"]', elements => {
      elements.forEach(el => el.value = '60');
    });
    await page.click('#ctl00_ContentPlaceHolder1_gvLCOwiseSMS_Invoice_ctl01_checkAll');
    return true;
}
  
async function enterCredentials(page) {
    updateInlineStatus(`Entering Credentials\n`);
    const { userId, password, itzPassword } = getCredentials();
    await page.waitForSelector('#ctl00_ContentPlaceHolder1_txtITZPasswordEPRS', { timeout: 30000 });
    await page.type('#ctl00_ContentPlaceHolder1_txtITZPasswordEPRS', itzPassword, { delay: 100 });
    return true;
}
  
async function waitForPageUpdateAfterSubmit(page, submitSelector) {
  const oldUrl = page.url();

  // Submit form and wait for either navigation or network idle
  await Promise.all([
    page.click(submitSelector),
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {}),
    page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 })
  ]);

  const newUrl = page.url();

  if (newUrl !== oldUrl) {
    console.log(`🔄 Successfully redirected.`);
  } else {
    console.log(`📡 No navigation, but page/network update detected.`);
  }
}


export default async function runDunning(browser) {
    const page2 = await browser.newPage();
    await page2.goto('https://biz.sitinetworks.com//Pages/LCO/PrepaidMultipleRecharge.aspx', { waitUntil: 'domcontentloaded' });
  
    try {
      await selectDayRange(page2);
      const oldTotal = await getRecordCount(page2);
      const success = await clickSearchAndWait(page2, oldTotal);
  
      if (!success) {
        console.log('❌ Record list did not update as expected');
        return;
      }
  
      const filled = await fillAmountsAndCheck(page2);
      if (!filled) return;
  
      const cred = await enterCredentials(page2);
      if (!cred) return;

      const balance = await page2
      .$eval('#ctl00_ContentPlaceHolder1_lblDealerWalletAmount', el => el.innerText)
      .catch(() => '');
      const amount = await page2
        .$eval('#ctl00_ContentPlaceHolder1_txtTotalselectedamount', el => el.value)
        .catch(() => '');
      console.log(`Balance - ₹${balance}\nAmount - ₹${amount}`);
      const balanceFloat = parseFloat(balance.replace(/[^0-9.-]+/g, '')); // Removing non-numeric characters
      const amountFloat = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
      if(balanceFloat > amountFloat){
        updateInlineStatus(`Clicking Submit\n`);
        await waitForPageUpdateAfterSubmit(page2, '#ctl00_ContentPlaceHolder1_Button1');
        updateInlineStatus(`✅ Submission complete\n`);
      }
      else{
        console.log('❌ Insufficient balance');
      }
      //await page2.screenshot({ path: 'sitiDunning_screenshot.png', fullPage: true });
  
    } catch (err) {
      console.log('❌ Error occurred:', err.message);
    }
  }