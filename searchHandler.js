import { pressAnyKeyToContinue } from './continueHandler.js';
import { closeAll } from './logoutHandler.js';
const bold = text => `\x1b[1m${text}\x1b[0m`; // ANSI bold
const divider = bold('─'.repeat(40));
let success = false;
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
  //making sure the text field is available by clicking on it thrice
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click('#ctl00_ContentPlaceHolder1_txtSearchText');

  await page.type('#ctl00_ContentPlaceHolder1_txtSearchText', query, { delay: 100 });
  await page.click('#ctl00_ContentPlaceHolder1_btnGo');
  await page.waitForSelector('#ctl00_UpdateProgress1', { hidden: true });
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!(await checkNoRecordFound(page))){
    success = true;
    const rowSelector = '#ctl00_ContentPlaceHolder1_gvItemListSummary > tbody > tr.GridRow';
    await page.waitForSelector(rowSelector);
    console.log('Getting subscriber details\n\n');
    //Sub detail frame
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.waitForSelector('input[id="ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnMoreinfo"]');
    await page.click('input[id="ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnMoreinfo"]', { timeout: 30000 });
    const iframeElementInfo = await page.waitForSelector('#ctl00_ContentPlaceHolder1_IframeBase');
    const iframeInfo = await iframeElementInfo.contentFrame();
    const subDetails = await getSubDetails(iframeInfo);
    console.log(formattedText(subDetails, "Subscriber Details"));
    await page.waitForSelector('#ctl00_ContentPlaceHolder1_PanelExtender');
    await page.click('#imgClose');
    const statusDetail = subDetails.find(detail => detail.label === 'Status');
    if (statusDetail && statusDetail.value.toLowerCase() === 'active') {
      //Pack detail frame
      //console.log('\nGetting Pack Details');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.waitForSelector('#ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnInstantRecharge');
      await page.click('#ctl00_ContentPlaceHolder1_gvItemListSummary_ctl02_ImgBtnInstantRecharge', { timeout: 30000 });
      const iframeElementRecharge = await page.waitForSelector('#ctl00_ContentPlaceHolder1_IframeBase');
      const iframeRecharge = await iframeElementRecharge.contentFrame();
      const packDetails = await getPackDetails(iframeRecharge);
      console.log(packDetails);
      await page.waitForSelector('#ctl00_ContentPlaceHolder1_PanelExtender');
      await page.click('#imgClose');
    }
    if(success){
      await closeAll(browser);
      await pressAnyKeyToContinue();
    }
    await closeAll(browser);
    return true;
  } else{
    await closeAll(browser);
    return false;
  }
}

async function checkNoRecordFound(page) {
  try {
    const rows = await page.$$eval(
      '#ctl00_ContentPlaceHolder1_gvItemListSummary > tbody > tr',
      trs => trs.map(tr => tr.textContent.trim())
    );

    // Check if any row contains "No record found"
    return rows.some(text => text.toLowerCase().includes('no record found'));
  } catch (error) {
    console.error("Error checking for 'No record found':", error);
    return false; // Assume records exist if check fails
  }
}

async function checkNoRecordFoundOnLocator(page, queryType) {
  const emptyRowSelector = `#ctl00_ContentPlaceHolder1_gv`+`${queryType}`+`No > tbody > tr.GridEmptyRow > td`;
  try {
    await page.waitForSelector(emptyRowSelector, { timeout: 5000 });
    const cellText = await page.$eval(emptyRowSelector, el => el.innerText.trim().toLowerCase());
    return cellText.includes('no record found');
  } catch (err) {
    // Either the selector didn't match, or something else went wrong
    console.warn('⚠️ Error while checking for empty record row:', err.message);
    return false;
  }
}

export async function searchLocator(browser, queryType, query) {
  const page = await browser.newPage();
  if (queryType === 'VC')
    await page.goto('https://biz.sitinetworks.com//Pages/Utilities/VClocator.aspx', { waitUntil: 'domcontentloaded' });
  else
    await page.goto('https://biz.sitinetworks.com//Pages/Utilities/STBlocator.aspx', { waitUntil: 'domcontentloaded' });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await page.click(`#ctl00_ContentPlaceHolder1_txt${queryType}No`);
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click(`#ctl00_ContentPlaceHolder1_txt${queryType}No`);
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.click(`#ctl00_ContentPlaceHolder1_txt${queryType}No`);
  await page.type(`#ctl00_ContentPlaceHolder1_txt${queryType}No`, query, { delay: 100 });
  await page.click('#ctl00_ContentPlaceHolder1_btnSubmit');
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.waitForSelector('#ctl00_UpdateProgress1', { hidden: true });
  await new Promise(resolve => setTimeout(resolve, 1000));
  let found = !(await checkNoRecordFoundOnLocator(page, queryType));

  if(found)
  {
    const boxDetails = [
      { label: 'VC', value: '-1' },
      { label: 'STB', value: '-1' },
      { label: 'Status', value: '-1' },
      { label: 'LCO', value: '-1' },
    ];

    await setDetail(boxDetails, page, 'VC', `#ctl00_ContentPlaceHolder1_gv${queryType}No > tbody > tr.GridRow > td:nth-child(2)`);
    await setDetail(boxDetails, page, 'STB', `#ctl00_ContentPlaceHolder1_gv${queryType}No > tbody > tr.GridRow > td:nth-child(3)`);
    await setDetail(boxDetails, page, 'Status', `#ctl00_ContentPlaceHolder1_gv${queryType}No > tbody > tr.GridRow > td:nth-child(1)`);
    await setDetail(boxDetails, page, 'LCO', `#ctl00_ContentPlaceHolder1_gv${queryType}No > tbody > tr.GridRow > td:nth-child(7)`);
    
    console.log(formattedText(boxDetails, "Other Cable Box Details"));
  }
  else{
    console.log(bold(`NOT FOUND IN BOTH ACCOUNTS`));
  }
  await closeAll(browser);
  await pressAnyKeyToContinue();
}

async function getPackDetails(frame) {
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  await frame.waitForSelector('#ctl00_ctl00_ContentPlaceHolder1_Details_gvExistingPackage');
  await frame.waitForSelector('#ctl00_ctl00_ContentPlaceHolder1_Details_lblgrandtotal_DPO');

  const rows = await frame.$$('#ctl00_ctl00_ContentPlaceHolder1_Details_gvExistingPackage > tbody > tr');
  
  const alacarte = [];
  const paidPackages = [];
  const freePackages = [];

  for (const row of rows) {
    const cells = await row.$$eval('td', tds => tds.map(td => td.innerText.trim()));
    if (cells.length === 0) continue;

    const [pkgCol, channelCol, , , priceCol] = cells;

    const isAlacarte = pkgCol.toLowerCase().includes('alacarte');
    const isFreeOrFTA = pkgCol.toLowerCase().includes('fta') || pkgCol.toLowerCase().includes('free');
    const price = parseFloat(priceCol) || 0;

    if (isAlacarte && channelCol) {
      alacarte.push({ channel: channelCol, package: pkgCol });
    } else if (isFreeOrFTA && pkgCol) {
      freePackages.push({ name: pkgCol });
    } else if (price > 0 && pkgCol) {
      paidPackages.push({ name: pkgCol, price });
    }
  }

  const grandTotalText = await frame.$eval('#ctl00_ctl00_ContentPlaceHolder1_Details_lblgrandtotal_DPO', el => el.innerText.trim());
  const grandTotal = parseFloat(grandTotalText) || 'Not Found';

  const summaryText = formatPackSummary({ alacarte, paidPackages, freePackages, grandTotal });
  return summaryText;
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

function formattedText(details, title, totalWidth = 40) {
  const separator = '─'.repeat(totalWidth);

  const wrapText = (label, value) => {
    const labelWidth = 15;
    const labelText = bold(label.padEnd(labelWidth));
    const indent = labelWidth + 2;
    const wrapWidth = totalWidth - indent;

    const words = value.split(' ');
    const lines = [];
    let line = '';

    for (const word of words) {
      if ((line + word).length > wrapWidth) {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim()) lines.push(line.trim());

    return lines
      .map((text, index) =>
        index === 0
          ? `${labelText}: ${text}`
          : ' '.repeat(indent) + text
      )
      .join('\n');
  };

  const formatValue = (label, value) => {
    if (label.toLowerCase() === 'address') {
      return wrapText(label, value);
    } else {
      return `${bold(label.padEnd(15))}: ${value}`;
    }
  };

  return (
    bold(`${title.toUpperCase()}:\n`) +
    bold(separator) + '\n' +
    details.map(d => formatValue(d.label, d.value)).join('\n') +
    '\n' +
    bold(separator)
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

function cleanText(str) {
  return str
    .replace(/\(.*?\)/g, '')      // Remove anything inside parentheses
    .replace(/\s+/g, ' ')         // Replace multiple spaces with a single space
    .trim()
    .split(' ')
    .map(word => {
      const upperWords = ['FTA', 'DPO', 'UP'];
      const upper = word.toUpperCase();
      return upperWords.includes(upper) ? upper : upper[0] + upper.slice(1).toLowerCase();
    })
    .join(' ');
}

function formatPackSummary({ alacarte, paidPackages, freePackages, grandTotal }) {

  const clean = text => cleanText(text); // Assuming cleanText is defined elsewhere

  const section = (title, items, itemFormatter) => {
    let out = bold(`\n${title}`) + '\n' + divider + '\n';
    if (items.length === 0) {
      out += '  None\n';
    } else {
      out += items.map(itemFormatter).map(line => '  ' + line).join('\n') + '\n';
    }
    return out;
  };

  const paidSection = section('📦 PAID PACKAGES:', paidPackages, p => clean(p.name));
  const freeSection = section('🎁 FREE / FTA PACKAGES:', freePackages, p => clean(p.name));
  const alacarteSection = section('📺 ALACARTE CHANNELS:', alacarte, c => clean(c.channel));

  const total = bold(`\n💰 GRAND TOTAL: ₹${grandTotal}\n`);

  return paidSection + freeSection + alacarteSection + total;
}
