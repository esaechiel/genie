import readline from 'readline';
import enquirer from 'enquirer';
const { Input, Confirm, Select } = enquirer;

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function askFromMenu(promptText, menuOptions) {
  console.log(`\n${promptText}`);
  menuOptions.forEach((opt, index) => {
    console.log(`  ${index + 1}. ${opt.label}`);
  });

  const validChoices = menuOptions.map((_, index) => (index + 1).toString());

  while (true) {
    const choice = await askQuestion(`Select an option [1-${menuOptions.length}]: `);
    if (validChoices.includes(choice)) {
      return menuOptions[Number(choice) - 1].value;
    }
    console.log(`❌ Invalid choice. Please enter a number between 1 and ${menuOptions.length}.`);
  }
}

// Exported prompts using menu

export async function askDaysInput() {
  const prompt = new Select({
    name: 'days',
    message: 'Select how many days of records to fill:',
    choices: [
      { name: '0', message: 'Today' },
      { name: '1', message: 'Tomorrow' },
      { name: '2', message: 'Next-2 days' },
      { name: '3', message: 'Next-3 days' },
      { name: '4', message: 'Next-4 days' },
      { name: '5', message: 'Next-5 days' }
    ]
  });

  const value = await prompt.run();
  const selectedValue = prompt.choices.find(choice => choice.name === value);
  readline.moveCursor(process.stdout, 0, -1);
  readline.cursorTo(process.stdout, 0);  // Move cursor to the beginning of the line
  readline.clearLine(process.stdout, 0); // Clear the current line
  console.log(`✅ You selected: ${selectedValue.message}`); // Print the label
  return value; // e.g. '0', '1', ..., '5'
}

export async function askSender() {
  const prompt = new Select({
    name: 'sender',
    message: 'Select sender:',
    choices: [
      { name: '8127802802', message: 'Megha Arora' },
      { name: '9336820382', message: 'Manish Arora' },
      { name: 'Other', message: 'Other' }
    ]
  });

  const value = await prompt.run();
  return value; // e.g. '0', '1', ..., '5'
}

export async function askAmount() {
  let amount;

  while (true) {
    const inputPrompt = new Input({
      message: 'Enter amount:',
      validate(value) {
        return /^\d+$/.test(value) ? true : 'Please enter numbers only';
      }
    });

    const input = await inputPrompt.run();
    amount = Number(input);

    if (amount < 1000) {
      console.log('❌ Amount must be at least ₹1000. Please try again.\n');
      continue;
    }

    if (amount > 10000) {
      const confirmPrompt = new Confirm({
        message: `You entered ₹${amount}. Are you sure you want to continue?`
      });

      const confirmed = await confirmPrompt.run();
      if (!confirmed) {
        continue;
      }
    }

    break;
  }

  return amount;
}

export async function confirmBothAccounts() {
  const confirmPrompt = new Confirm({
    message: `Do you want it done for both accounts?`
  });
  const confirmed = await confirmPrompt.run();
  return confirmed;
}

export async function askMobile() {
  while (true) {
    const inputPrompt = new Input({
      message: 'Enter a 10-digit mobile number:',
      validate(value) {
        return /^\d{10}$/.test(value) ? true : 'Please enter valid a mobile number';
      }
    });

    const mob = await inputPrompt.run();

    if (/^\d{10}$/.test(mob)) {
      return mob; // Valid input — return it
    }
  }
}

export async function askVC() {
  while (true) {
    const inputPrompt = new Input({
      message: 'Enter VC number:',
      validate(value) {
        return /^\d+$/.test(value) ? true : 'Please enter valid VC number';
      }
    });

    const vc = await inputPrompt.run();

    if (/^\d+$/.test(vc)) {
      return vc; // Valid input — return it
    }
  }
}

export async function askSTB() {
  while (true) {
    const inputPrompt = new Input({
      message: 'Enter STB number:',
      validate(value) {
        return /^[a-zA-Z0-9]+$/.test(value)
          ? true
          : 'Please enter a valid STB number';
      }
    });

    const stb = await inputPrompt.run();

    if (/^[a-zA-Z0-9]+$/.test(stb)) {
      return stb;
    }
  }
}

export async function askAccount() {
  const prompt = new Select({
    name: 'account',
    message: 'Select account:',
    choices: [
      { name: '0', message: 'MM' },
      { name: '1', message: 'RM' }
    ]
  });

  const selectedAccount = await prompt.run();
  readline.moveCursor(process.stdout, 0, -1);
  readline.cursorTo(process.stdout, 0);  // Move cursor to the beginning of the line
  readline.clearLine(process.stdout, 0); // Clear the current line
  return selectedAccount; // returns '0' or '1' as string
}

export async function askQueryTypeSiti() {
  const prompt = new Select({
    name: 'sitiQueryType',
    message: 'Select type:',
    choices: [
      { name: 'VC', message: 'VC' },
      { name: 'STB', message: 'STB' }
    ]
  });

  const selectedType = await prompt.run();
  readline.moveCursor(process.stdout, 0, -1);
  readline.cursorTo(process.stdout, 0);  // Move cursor to the beginning of the line
  readline.clearLine(process.stdout, 0); // Clear the current line
  return selectedType;
}

/*export async function askObjective() {
  const options = [
    { label: 'Log in OYC', value: '0' },
    { label: 'Add Money', value: '1' },
    { label: 'Get Dunning Data', value: '2' },
    { label: 'Run Dunning', value: '3' },
    { label: 'Search', value: '4' },
    { label: 'Logout', value: '5' },
    { label: 'Exit', value: '-9999' },

  ];
  const index =  await askFromMenu('What would you like to do:', options);
  const linesToClear = options.length + 3;
  for (let i = 0; i < linesToClear; i++) {
    readline.cursorTo(process.stdout, 0);      // Move to start of line
    readline.clearLine(process.stdout, 0);     // Clear the line
    readline.moveCursor(process.stdout, 0, -1); // Move up one line
  }
  readline.cursorTo(process.stdout, 0);        // Move to start of final cleared line
  readline.clearLine(process.stdout, 0);

  return options.find(opt => opt.value === index);
}*/

export async function askObjective() {
  const prompt = new Select({
    name: 'objective',
    message: 'What would you like to do:',
    choices: [
      { name: '0', message: 'Log in OYC' },
      { name: '1', message: 'Add Money' },
      { name: '2', message: 'Get Dunning Data' },
      { name: '3', message: 'Run Dunning' },
      { name: '4', message: 'Auto Dunning' },
      { name: '5', message: 'Search' },
      { name: '6', message: 'Logout' },
      { name: '-9999', message: 'Exit' },
    ]
  });

  const index = await prompt.run();
  const selectedOption = prompt.choices.find(choice => choice.name === index);
  readline.moveCursor(process.stdout, 0, -1);
  readline.cursorTo(process.stdout, 0);  // Move cursor to the beginning of the line
  readline.clearLine(process.stdout, 0); // Clear the current line
  console.log(`✅ You selected: ${selectedOption.message}`); // Print the label

  return index;
}

