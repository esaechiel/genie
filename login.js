import { getCredentials } from './credentials.js';
import path from 'path';
import readline from 'readline';
import { solveCaptcha } from './captchaHandler.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Required setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}


export async function loginOYC(browser, silent, credentials) {

  const sitiCableTab = await browser.newPage();
  const { userId, password, itzPassword } = credentials;
  const url = credentials.label === 'MM' ? 'https://biz.sitinetworks.com' : 'https://ebiz.sitinetworks.com';
  const imageName = credentials.label === 'MM' ? 'captcha_screenshot_MM.png' : 'captcha_screenshot_RM.png';
  const absoluteImagePath = path.resolve(__dirname, imageName);
  let success = false;
  let attempts = 1;
  let subAttempts = 1;
  while (attempts < 11 && !success) {
    if(subAttempts === 1){
      if(attempts > 1 && !silent){
        readline.clearLine(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
      }
      if (!silent)
        process.stdout.write(`Login Attempt ${attempts}\n\r`);
  }
    if (!silent)
    updateInlineStatus(`🌐 Opening Siti Networks...`);
    await sitiCableTab.goto(url , { waitUntil: 'networkidle0' });

    if (!silent)
    updateInlineStatus(`🖼️ Capturing captcha...`);
    const captchaElement = await sitiCableTab.$('#ctl00_ContentPlaceHolder1_CaptchaCode1_Image1');
    if (!captchaElement) {
      if (!silent)
      updateInlineStatus('❌ Captcha image not found. Retrying...');
      continue;
    }
    await captchaElement.screenshot({ path: absoluteImagePath });
    if (!silent)
    updateInlineStatus(`🤖 Solving captcha...`);
    let captchaCode;
    try {
      captchaCode = await solveCaptcha(absoluteImagePath);
    } catch (err) {
      if (!silent)
      console.error('❌ Failed to solve captcha');
      break;
    }
    if (captchaCode === '-1') {
      if (!silent)
      updateInlineStatus(`🔁 Captcha failed, retrying...`);
      subAttempts++;
      continue; // Retry the loop
    }
    if (!silent)
    updateInlineStatus(`✅ Captcha solved: ${captchaCode}`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_CaptchaCode1_txtCapchaCode', captchaCode);
    if (!silent)
    updateInlineStatus(`🔐 Entering credentials...`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtUserID', userId);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtPassword', password);
    if (!silent)
    updateInlineStatus(`🚪 Logging in...`);
    try {
      await Promise.all([
        sitiCableTab.waitForNavigation({ waitUntil: 'networkidle0' }),
        sitiCableTab.click('#ctl00_ContentPlaceHolder1_btnLogin')
      ]);
    } catch (err) {
      if (!silent)
      console.log('❌ Login or navigation failed. Retrying...');
    }

    await new Promise(resolve => setTimeout(resolve, 2000)); // Let the error message appear if it's going to

    const errorText = await sitiCableTab.$eval('#ctl00_lblMessage', el => el.innerText).catch(() => '');

    if (errorText.includes('Invalid captcha code')) {
      if (!silent)
      updateInlineStatus(`⚠️ Invalid captcha entered.`);
      attempts++;
      subAttempts = 1;
      continue;
    } else {
      if (!silent){
      readline.cursorTo(process.stdout, 0);      // Move to start of line
      readline.clearLine(process.stdout, 0);     // Clear the line
      readline.moveCursor(process.stdout, 0, -1); // Move up one line
      updateInlineStatus(`Logged in after ${attempts} attempts.\n`);
    }
      success = true;
      break;
    }
  }

  if (!success) {
    updateInlineStatus('❌ Exceeded max attempts. Login failed.');
  }
  return success;
}
