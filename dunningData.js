// dunning.js
import { parse } from 'path';
import { pressAnyKeyToContinue } from './continueHandler.js';
import { getCredentials } from './credentials.js';
import { closeAll } from './logoutHandler.js';
export default async function runDunningData(credentials, browser, auto, days) {
  const page = await browser.newPage();
  const dunningPageURL = credentials.label === 'MM' ? 'https://biz.sitinetworks.com/Pages/LCO/PrepaidMultipleRecharge.aspx' : 'https://ebiz.sitinetworks.com/Pages/LCO/PrepaidMultipleRecharge.aspx';
  await page.goto(dunningPageURL, { waitUntil: 'domcontentloaded' });

  const balance = await page
    .$eval('#ctl00_ContentPlaceHolder1_lblDealerWalletAmount', el => el.innerText)
    .catch(() => '');

  const dashboardPageURL = credentials.label === 'MM' ? 'https://biz.sitinetworks.com/Reports/CustomerDueReport_Prepaid.aspx?Days=0' : 'https://ebiz.sitinetworks.com/Reports/CustomerDueReport_Prepaid.aspx?Days=0';
  await page.goto(dashboardPageURL, { waitUntil: 'domcontentloaded' });

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
  if (!auto) {
    await printAllData(balance, rechargeData, credentials);
    await closeAll(browser);
  }
  else {
    if (days + 1 > 0 && days + 1 < 6) {
      await closeAll(browser);
      return await autoDunning(balance, rechargeData, days, credentials);
    }
  }
}

async function autoDunning(balance, rechargeData, days, credentials) {
  const subs = rechargeData[days]?.count;
  const amt = subs * 60;
  const rawAmt = amt - parseInt(balance, 10) + (100 * (days + 1));
  let rechargeAmt;
  if (rawAmt > 1000) {
    rechargeAmt = Math.ceil(rawAmt / 100) * 100;
  }
  if (rawAmt > 0 && rawAmt < 1000) {
    rechargeAmt = 1000;
  }
  if (rawAmt < 0) {
    rechargeAmt = 0;
  }
  console.log(`${credentials.label} amount - ₹` + String(rechargeAmt));
  return rechargeAmt;
}

async function printAllData(balance, rechargeData, credentials) {
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
}
