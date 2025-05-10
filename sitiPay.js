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
  

export default async function addMoney(browser,page) {
    
    const page2 = await browser.newPage();
    await page2.goto('https://www.sitinetworks.com/LCOLogin.php');  
    console.log('🟢 Siti Pay Opened');
    const { userId, password, itzPassword } = getCredentials();
    await page2.type('#ContentPlaceHolder1_txtUserID', userId);
    await page2.type('#ContentPlaceHolder1_txtPassword', password);
  
  await countdown(5);

  updateInlineStatus(`Logging in...\n`);
  try {
     await page2.click('#ContentPlaceHolder1_btnLCOLogin');
    } catch (err) {
    console.log('\n❌ Login or navigation failed:', err.message);
    }

    await page2.screenshot({ path: 'sitiPayTab_screenshot.png', fullPage: true });
  }
