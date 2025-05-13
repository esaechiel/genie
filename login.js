import { getCredentials } from './credentials.js';
import readline from 'readline';
import { solveCaptcha } from './captchaHandler.js';


function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}


export async function loginOYC(browser) {

  const sitiCableTab = await browser.newPage();
  const { userId, password, itzPassword } = getCredentials();

  let success = false;
  let attempts = 1;
  let subAttempts = 1;
  while (attempts < 5 && !success) {
    if(subAttempts === 1){
      if(attempts > 1){
        readline.clearLine(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
      }
    process.stdout.write(`Login Attempt ${attempts}\n\r`);
  }
    updateInlineStatus(`🌐 Opening Siti Networks...`);
    await sitiCableTab.goto('https://biz.sitinetworks.com' , { waitUntil: 'networkidle0' });

    updateInlineStatus(`🖼️ Capturing captcha...`);
    const captchaElement = await sitiCableTab.$('#ctl00_ContentPlaceHolder1_CaptchaCode1_Image1');
    if (!captchaElement) {
      console.log('❌ Captcha image not found. Retrying...');
      continue;
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
      subAttempts++;
      continue; // Retry the loop
    }
    updateInlineStatus(`✅ Captcha solved: ${captchaCode}`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_CaptchaCode1_txtCapchaCode', captchaCode);
    updateInlineStatus(`🔐 Entering credentials...`);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtUserID', userId);
    await sitiCableTab.type('#ctl00_ContentPlaceHolder1_txtPassword', password);
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
      subAttempts = 1;
      continue;
    } else {
      updateInlineStatus('We`re in\n');
      success = true;
      break;
    }
  }

  if (!success) {
    console.log('❌ Exceeded max attempts. Login failed.');
  }
}
