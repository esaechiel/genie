// dunning.js
export default async function runDunningData(browser) {
  const page = await browser.newPage();
  await page.goto('http://biz.sitinetworks.com/Pages/LCO/PrepaidMultipleRecharge.aspx', { waitUntil: 'domcontentloaded' });

  const balance = await page
    .$eval('#ctl00_ContentPlaceHolder1_lblDealerWalletAmount', el => el.innerText)
    .catch(() => '');

  await page.goto('http://biz.sitinetworks.com/Reports/CustomerDueReport_Prepaid.aspx?Days=0' , { waitUntil: 'domcontentloaded' });

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

  console.log('\n📊 Recharge data:\n');
  console.log(`Balance - ₹${balance}\n`);
  console.log('Date'.padEnd(15) + 'Number'.padEnd(10) + 'Amount');
  rechargeData.forEach(({ label, count }) => {
    const amount = count * 60;
    console.log(
      label.padEnd(15) +
      String(count).padEnd(10) +
      `₹${amount}`
    );
  });
}
