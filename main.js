import puppeteer from 'puppeteer';
import runDunningData from './dunningData.js'
import addMoney from './sitiPay.js'
import runDunning from './runDunning.js'
import { loadCredentials, loadSitiMM, loadSitiRM } from './credentials.js';
import { getCredentials } from './credentials.js';
import { askObjective, askVC, confirmBothAccounts } from './inputHelper.js';
import { loginOYC } from './login.js';
import { logout } from './logoutHandler.js'
import { runSearchSiti } from './searchHandler.js'

const startTime = performance.now();

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
  let loggedIn = false;
  let exitFlag = false;
  do{
    const objective = await askObjective();
    let choice = objective;
    let credentials = null;
    switch (choice){
      case '0': //just login
        if (!loggedIn){
          console.log('Attempting Login...');
          credentials = await loadCredentials();
          console.log(`🔐 Logging in as ${credentials.label}`);
          await loginOYC(browser);
          loggedIn = true;
        }
        else{
          credentials = await getCredentials();
          console.log(`Already logged in as ${credentials.label}`);
        }
      break;
      case '1': //add money
        console.log('Adding Money...');
        credentials = await loadCredentials();
        console.log(`🔐 Logging in as ${credentials.label}`);
        await addMoney(browser);
      break;
      case '2': //get dunning data
        if(!(await confirmBothAccounts())){//single account
          console.log('Getting Dunning Data...');
          if (!loggedIn){
            credentials = await loadCredentials();
            console.log(`🔐 Logging in as ${credentials.label}`);
            await loginOYC(browser);
            loggedIn = true;
          }
          await runDunningData(browser);
        }
        else{//both accounts
          if (!loggedIn){
            credentials = await loadSitiMM();
            console.log(`🔐 Logging in as ${credentials.label}`);
            await loginOYC(browser);
            loggedIn = true;
          }
          await runDunningData(browser);
          await logout(browser);
          if (credentials.label === 'MM')
            credentials = await loadSitiRM();
          else
            credentials = await loadSitiMM();
          await loginOYC(browser);
          await runDunningData(browser);
        }
      break;
      case '3': //run dunning
        if (!loggedIn){
          credentials = await loadCredentials();
          console.log(`🔐 Logging in as ${credentials.label}`);
          await loginOYC(browser);
          loggedIn = true;
        }
        console.log('Recharging Accounts...');
        await runDunning(browser);
      break;
      case '4': //search
        const query = await askVC();
        if (!loggedIn){
          credentials = await loadSitiMM();
          console.log(`🔐 Logging in as ${credentials.label}`);
          await loginOYC(browser);
          loggedIn = true;
        }
        credentials = await getCredentials();
        console.log(`🔍 Searching in ${credentials.label}`);
        let found = await runSearchSiti(browser , 'VC' , query);
        //if not found in one account then go to another account
        if(!found){
          console.log('Switiching!');
          await logout(browser);
          if (credentials.label === 'MM')
            credentials = await loadSitiRM();
          else
            credentials = await loadSitiMM();
          await loginOYC(browser);
          console.log(`🔍 Searching in ${credentials.label}`);
          found = await runSearchSiti(browser , 'VC' , query);
        }
      break;
      case '5': //logout
        if(loggedIn){
          await logout(browser);
          loggedIn = false;
        }
        else{
          console.log('Logged out already');
        }
      break;
      case '-9999': //exit
        console.log(`Exiting...`);
        await browser.close();
        exitFlag=true;  
      break;
    }
  }while(!exitFlag);

    const endTime = performance.now();  // End measuring
    const executionTime =Math.round(((endTime - startTime) / 1000) * 100) / 100;  // Convert to seconds
    console.log(`Total script execution time: ${executionTime} seconds`);
  }

runPuppeteer();