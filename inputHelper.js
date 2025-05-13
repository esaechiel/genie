import readline from 'readline';
import enquirer from 'enquirer';
const { Input, Confirm } = enquirer;

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
  const options = [
    { label: 'Today', value: '0' },
    { label: 'Tomorrow', value: '1' },
    { label: 'Next-2 days', value: '2' },
    { label: 'Next-3 days', value: '3' },
    { label: 'Next-4 days', value: '4' },
    { label: 'Next-5 days', value: '5' },
  ];
  return await askFromMenu('Select how many days of records to fill:', options);
}

export async function askAmount() {
  let amount;

  while (true) {
    const inputPrompt = new Input({
      message: 'Enter the amount to fill for each invoice:',
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


export async function askAccount() {
  const options = [
    { label: 'MM', value: '0' },
    { label: 'RM', value: '1' }
  ];
  return await askFromMenu('Select account:', options);
}

export async function askObjective() {
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
  return options.find(opt => opt.value === index);
}
