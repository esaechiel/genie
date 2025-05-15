export async function logout(browser, silent){
    const newPage = await browser.newPage();
          await newPage.goto('https://biz.sitinetworks.com//Logout.aspx', { waitUntil: 'domcontentloaded' });
          const pages = await browser.pages();
          for (const page of pages) {  // Close all other tabs except the new one
            if (page !== newPage) {
              await page.close();
            }
          }
          if (!silent)
          console.log('Logged out successfully and cleared tabs');
}

export async function closeAll(browser) {
  const newPage = await browser.newPage();
  const pages = await browser.pages();
  for (const page of pages) {  // Close all other tabs except the new one
    if (page !== newPage) {
      await page.close();
    }
  }
}