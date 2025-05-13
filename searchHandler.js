export async function runSearchSiti(browser, queryType, query) {
  const page = await browser.newPage();
  await page.goto('https://biz.sitinetworks.com//Pages/LCO/LCODashboard.aspx', { waitUntil: 'domcontentloaded' });

  await page.waitForSelector('#ctl00_ContentPlaceHolder1_ddlSearchFor', { timeout: 30000 });

  if (queryType === 'VC') {
    await page.select('#ctl00_ContentPlaceHolder1_ddlSearchFor', '2');
  } else if (queryType === 'STB') {
    await page.select('#ctl00_ContentPlaceHolder1_ddlSearchFor', '3');
  } else {
    await page.select('#ctl00_ContentPlaceHolder1_ddlSearchFor', '1');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');
  await page.type('#ctl00_ContentPlaceHolder1_txtSearchText', query, { delay: 100 });
  await page.click('#ctl00_ContentPlaceHolder1_btnGo');
  await page.waitForSelector('#ctl00_UpdateProgress1', { hidden: true });

  const rowSelector = '#ctl00_ContentPlaceHolder1_gvItemListSummary > tbody > tr.GridRow';
  await page.waitForSelector(rowSelector);
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.waitForSelector('input[id="ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnMoreinfo"]');
  await page.click('input[id="ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnMoreinfo"]', { timeout: 30000 });


  const iframeElement = await page.waitForSelector('#ctl00_ContentPlaceHolder1_IframeBase');
  const iframe = await iframeElement.contentFrame();

  const subDetails = await getSubDetails(iframe);
  console.log('\n');
  console.log(formattedText(subDetails));

  //await page.close();
}


async function getSubDetails(page) {
    
  const subDetails = [
    { label: 'Name', value: '-1' },
    { label: 'Address', value: '-1' },
    { label: 'VC', value: '-1' },
    { label: 'STB', value: '-1' },
    { label: 'Status', value: '-1' },
    { label: 'Mobile', value: '-1' },
    { label: 'Last Activity', value: '-1' },
    { label: 'LCO', value: '-1' },
  ];

  await setDetail(subDetails, page, 'Name', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(5) > td.NormalText');
  await setDetail(subDetails, page, 'Address', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(6) > td.NormalText');
  await setDetail(subDetails, page, 'VC', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(3)');
  await setDetail(subDetails, page, 'STB', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(6)');
  await setDetail(subDetails, page, 'Status', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(6)');
  await setDetail(subDetails, page, 'Mobile', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(7) > td:nth-child(6)');
  await setDetail(subDetails, page, 'Last Activity', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(12) > td:nth-child(6)');
  await setDetail(subDetails, page, 'LCO', '#aspnetForm > div:nth-child(8) > table > tbody > tr:nth-child(1) > td > table:nth-child(1) > tbody > tr:nth-child(9) > td:nth-child(3)');

  return subDetails;
}

function formattedText(details) {
  const bold = text => `\x1b[1m${text}\x1b[0m`; // ANSI bold

  return (
    bold('Subscriber Details:\n') +
    bold('='.repeat(40)) + '\n' +
    details
      .map(d => `${bold(d.label.padEnd(15))}: ${d.value}`)
      .join('\n') +
    '\n' +
    bold('='.repeat(40))
  );
}

async function setDetail(array, page, label, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    const value = await page.$eval(selector, el => el.innerText.trim());
    const index = array.findIndex(item => item.label === label);
    if (index > -1) array[index].value = value || '-1';
  } catch (err) {
    console.warn(`Could not extract ${label}: ${err.message}`);
  }
}
