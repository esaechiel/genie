// dunning.js
import { pressAnyKeyToContinue } from './continueHandler.js';
import { getCredentials } from './credentials.js';
import { closeAll } from './logoutHandler.js';
export default async function runDunningData(browser, both) {
  const credentials = await getCredentials();
  const page = await browser.newPage();
  await page.goto('https://biz.sitinetworks.com/Pages/LCO/PrepaidMultipleRecharge.aspx', { waitUntil: 'domcontentloaded' });

  const balance = await page
    .$eval('#ctl00_ContentPlaceHolder1_lblDealerWalletAmount', el => el.innerText)
    .catch(() => '');

  await page.goto('https://biz.sitinetworks.com/Reports/CustomerDueReport_Prepaid.aspx?Days=0' , { waitUntil: 'domcontentloaded' });

  const rechargeData = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const data = [];

    links.forEach(link => {
      const text = link.textContent.trim();
      const match = text.match(/(.+?)\s*\(.*?\)\s*:\s*(\d+)/);
      if (match) {
        const label = match[1];
        const count = parseInt(match[2], 10);
        data.push({ label, count });
      }
    });

    return data;
  });
  const bold = text => `\x1b[1m${text}\x1b[0m`;
  const divider = bold('─'.repeat(40));
  
  // Column widths
  const widths = {
    date: 15,
    number: 10,
    amount: 11
  };
  
  const center = (text, width) => {
    const left = Math.floor((width - text.length) / 2);
    const right = width - text.length - left;
    return ' '.repeat(left) + text + ' '.repeat(right);
  };
  
  console.log('\n' + divider);
  console.log(bold(center(`📊 Recharge data for ${credentials.label}`, 40)));
  console.log(divider);
  console.log(center(bold(`Balance - ₹${balance}`), 40) + '\n');
  
  // Header row (centered and bold)
  console.log(
    '|' + bold(center('Date', widths.date)) +
    '|' + bold(center('Number', widths.number)) +
    '|' + bold(center('Amount', widths.amount)) +
    '|'
  );
  
  // Table rows
  rechargeData.forEach(({ label, count }) => {
    const amount = count * 60;
    console.log(
      '|' + label.padEnd(widths.date) +
      '|' + String(count).padEnd(widths.number) +
      '|' + `₹${amount}`.padEnd(widths.amount) +
      '|'
    );
  });
  
  console.log(divider);
  await closeAll(browser);
  if (!both)
  await pressAnyKeyToContinue();
}
