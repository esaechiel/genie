import puppeteer from 'puppeteer';
import runDunningData from './dunningData.js';
import addMoney from './sitiPay.js';
import runDunning from './runDunning.js';
import { loadCredentials, loadSitiMM, loadSitiRM, getCredentials } from './credentials.js';
import { askObjective, askQueryTypeSiti, askVC, askSTB, confirmBothAccounts, askDaysInput } from './inputHelper.js';
import { loginOYC } from './login.js';
import { logout } from './logoutHandler.js';
import { runSearchSiti, searchLocator } from './searchHandler.js';
import { pressAnyKeyToContinue } from './continueHandler.js';
import { captureOutput } from './captureOutput.js';

//const startTime = performance.now();

const args = process.argv.slice(2);
let show = args.includes('--show');

const mmCredentials = await loadSitiMM();
const rmCredentials = await loadSitiRM();

function updateInlineStatus(message) {
  process.stdout.clearLine(0);    // Clear the current line
  process.stdout.cursorTo(0);     // Move cursor to start of line
  process.stdout.write(message);  // Write the new message
}

async function handleLogin(MMbrowser, RMbrowser, loggedIn) {
  if (loggedIn) {
    console.log('✅ Already logged in');
    return true;
  }

  updateInlineStatus('🔐 Logging in both accounts...');

  try {
    const [loggedInMM, loggedInRM] = await Promise.all([
      loginOYC(MMbrowser, true, mmCredentials),
      loginOYC(RMbrowser, true, rmCredentials)
    ]);

    updateInlineStatus('✅ Login complete!\n');
    return loggedInMM && loggedInRM;
  } catch (err) {
    updateInlineStatus('❌ Login failed.\n');
    throw err;
  }
}

async function handleAddMoney(browser, loggedIn) {
  const credentials = await loadCredentials();
  console.log('Adding Money...');
  await addMoney(browser);
  return loggedIn;
}

async function handleDunningData(MMbrowser, RMbrowser, loggedIn) {
  if (!loggedIn) {
    loggedIn = await handleLogin(MMbrowser, RMbrowser, loggedIn);
  }
  let outputMM = await captureOutput(() => runDunningData(mmCredentials, MMbrowser));
  let outputRM = await captureOutput(() => runDunningData(rmCredentials, RMbrowser));

  console.log(outputMM);
  console.log(outputRM);

  return loggedIn;
}

async function handleRunDunning(MMbrowser, RMbrowser, loggedIn) {
  const daysToSelect = await askDaysInput();

  if (!loggedIn) {
    loggedIn = await handleLogin(MMbrowser, RMbrowser, loggedIn);
  }
  console.log('Recharging Accounts...');
  await runDunning(MMbrowser, daysToSelect, mmCredentials);
  await runDunning(RMbrowser, daysToSelect, rmCredentials);
  return loggedIn;
}

async function handleAutoDunning(browser, loggedIn) {
  const days = parseInt(await askDaysInput(), 10);

  if (!loggedIn) {
    await loadSitiMM();
    await loginOYC(browser, true);
    loggedIn = true;
  }

  let amt = await runDunningData(browser, true, true, days);
  if (amt > 0) await addMoney(browser, amt);

  await logout(browser, true);

  let credentials = await getCredentials();
  credentials = credentials.label === 'MM' ? await loadSitiRM() : await loadSitiMM();

  await loginOYC(browser, true);
  amt = await runDunningData(browser, true, true, days);
  if (amt > 0) await addMoney(browser, amt);

  await pressAnyKeyToContinue();
  return loggedIn;
}

async function handleSearch(MMbrowser, RMbrowser, loggedIn) {
  const queryType = await askQueryTypeSiti();
  const query = queryType === 'VC' ? await askVC() : await askSTB();

  let foundinMM, foundinRM, outputSearch;

  if (!loggedIn) {
    loggedIn = await handleLogin(MMbrowser, RMbrowser, loggedIn);
  }

  updateInlineStatus('🔍 Searching in both accounts...');
  const mmResult = await captureOutput(() => runSearchSiti(mmCredentials, MMbrowser, queryType, query));
  const rmResult = await captureOutput(() => runSearchSiti(rmCredentials, RMbrowser, queryType, query));
  foundinMM = mmResult.includes('SUBSCRIBER DETAILS'); // or whatever marker
  foundinRM = rmResult.includes('SUBSCRIBER DETAILS');

  if (!foundinMM && !foundinRM) {
    outputSearch = await captureOutput(() =>
      searchLocator(MMbrowser, queryType, query)
    );
  } else if (foundinMM) {
    outputSearch = mmResult;
  } else if (foundinRM) {
    outputSearch = rmResult;
  }
  updateInlineStatus('✅ Search complete!\n\n');
  console.log(outputSearch);
  return loggedIn;
}

async function handleLogout(MMbrowser, RMbrowser, loggedIn) {
  if (loggedIn) {
    await logout(MMbrowser, true, mmCredentials);
    await logout(RMbrowser, true, rmCredentials);
    console.log('✅ Successfully logged out');
    return false;
  } else {
    console.log('Logged out already');
    return false;
  }
}

async function handleExit(MMbrowser, RMbrowser) {
  await MMbrowser.close();
  await RMbrowser.close();
  return true;
}

async function runPuppeteer() {
  console.log('🚀 Initialising...');
  const MMbrowser = await puppeteer.launch({
    headless: !show,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 3,
    },
  });
  const RMbrowser = await puppeteer.launch({
    headless: !show,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 3,
    },
  });

  let loggedIn = false;
  let exitFlag = false;

  do {
    const objective = await askObjective();

    switch (objective) {
      case '0':
        loggedIn = await measureExecutionTime(handleLogin, MMbrowser, RMbrowser, loggedIn);
        //handleLogin(MMbrowser, RMbrowser, loggedIn);
        break;
      case '1':
        loggedIn = await measureExecutionTime(handleAddMoney, MMbrowser, loggedIn);
        break;
      case '2':
        loggedIn = await measureExecutionTime(handleDunningData, MMbrowser, RMbrowser, loggedIn);
        break;
      case '3':
        loggedIn = await measureExecutionTime(handleRunDunning, MMbrowser, RMbrowser, loggedIn);
        break;
      case '4':
        loggedIn = await measureExecutionTime(handleAutoDunning, MMbrowser, loggedIn);
        break;
      case '5':
        loggedIn = await measureExecutionTime(handleSearch, MMbrowser, RMbrowser, loggedIn);
        break;
      case '6':
        loggedIn = await measureExecutionTime(handleLogout, MMbrowser, RMbrowser, loggedIn);
        break;
      case '-9999':
        exitFlag = await handleExit(MMbrowser, RMbrowser);
        break;
    }
  } while (!exitFlag);

  //const endTime = performance.now();
  //const executionTime = Math.round(((endTime - startTime) / 1000) * 100) / 100;
  //console.log(`Total script execution time: ${executionTime} seconds`);
}

async function measureExecutionTime(fn, ...args) {
  const startTime = performance.now();
  const result = await fn(...args); // Await the async function
  const endTime = performance.now();
  const executionTime = Math.round(((endTime - startTime) / 1000) * 100) / 100;
  console.log(`Execution time: ${executionTime} seconds`);
  return result; // Return the function's output if needed
}


runPuppeteer();
