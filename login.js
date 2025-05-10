import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import runDunningData from './dunningData.js'
import addMoney from './sitiPay.js'
import runDunning from './runDunning.js'
import { loadCredentials } from './credentials.js';
import { getCredentials } from './credentials.js';

const credentials = await loadCredentials();
console.log(`🔐 Logging in as ${credentials.label}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const startTime = performance.now();

const solveCaptcha = () => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, 'solver.py');
    const command = `python3 "${pythonScriptPath}"`; // Use "python3" if needed

    exec(command, (error, stdout) => {
      if (error) {
        console.error(`❌ Python error: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}


async function runPuppeteer() {
  console.log('🚀 Initialising...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 3, // Increase to 3 for high-DPI
    },
  });
  const sitiCableTab = await browser.newPage();
  const { userId, password, itzPassword } = getCredentials();

  let success = false;
  let attempts = 0;

  console.log(`🌀 Login Attempt ${attempts + 1}`);
  while (attempts < 5 && !success) {

    updateInlineStatus(`🌐 Opening Siti Networks...`);
    await sitiCableTab.goto('https://biz.sitinetworks.com');

    updateInlineStatus(`🔐 Entering credentials...`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtUserID', userId);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtPassword', password);

    updateInlineStatus(`🖼️ Capturing captcha...`);
    const captchaElement = await sitiCableTab.$('#ctl00_ContentPlaceHolder1_CaptchaCode1_Image1');
    if (!captchaElement) {
      console.log('❌ Captcha image not found. Exiting...');
      break;
    }
    await captchaElement.screenshot({ path: 'captcha_screenshot.png' });

    updateInlineStatus(`🤖 Solving captcha...`);
    let captchaCode;
    try {
      captchaCode = await solveCaptcha();
    } catch (err) {
      console.error('❌ Failed to solve captcha');
      break;
    }

    if (captchaCode === '-1') {
      updateInlineStatus(`🔁 Captcha failed, retrying...`);
      continue; // Retry the loop
    }

    updateInlineStatus(`✅ Captcha solved: ${captchaCode}`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_CaptchaCode1_txtCapchaCode', captchaCode);

    updateInlineStatus(`🚪 Logging in...`);
    try {
      await Promise.all([
        sitiCableTab.waitForNavigation({ waitUntil: 'networkidle0' }),
        sitiCableTab.click('#ctl00_ContentPlaceHolder1_btnLogin')
      ]);
    } catch (err) {
      console.log('❌ Login or navigation failed. Retrying...');
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Let the error message appear if it's going to

    const errorText = await sitiCableTab.$eval('#ctl00_lblMessage', el => el.innerText).catch(() => '');

    if (errorText.includes('Invalid captcha code')) {
      updateInlineStatus(`⚠️ Invalid captcha entered.`);
      attempts++;
      updateInlineStatus(`🌀 Login Attempt ${attempts + 1}\n`);
      continue;
    } else {
      console.log('\nWe`re in');
      console.log('Getting Dunning Data...');
      await runDunningData(sitiCableTab);
      //await addMoney(browser,sitiCableTab);
      await runDunning(browser,sitiCableTab);
      success = true;
      break;
    }
  }


  if (success) {
    console.log('✅ Capturing full pages screenshot...');
    await sitiCableTab.screenshot({ path: 'sitiCableTab_screenshot.png', fullPage: true });
  } else {
    console.log('❌ Exceeded max attempts. Login failed.');
  }

  await browser.close();

  const endTime = performance.now();  // End measuring
  const executionTime =Math.round(((endTime - startTime) / 1000) * 100) / 100;  // Convert to seconds
  console.log(`Total script execution time: ${executionTime} seconds`);

}

runPuppeteer();

