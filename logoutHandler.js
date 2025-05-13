export async function logout(browser){
    const newPage = await browser.newPage();
          await newPage.goto('http://biz.sitinetworks.com//Logout.aspx', { waitUntil: 'domcontentloaded' });
          const pages = await browser.pages();
          for (const page of pages) {  // Close all other tabs except the new one
            if (page !== newPage) {
              await page.close();
            }
          }
          console.log('Logged out successfully and cleared tabs');
}