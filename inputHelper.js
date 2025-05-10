import readline from 'readline';

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

export async function askAmountChoice() {
  const options = [
    { label: '₹30 per invoice', value: '30' },
    { label: '₹60 per invoice', value: '60' },
    { label: '₹90 per invoice', value: '90' },
  ];
  return await askFromMenu('Select the amount to fill for each invoice:', options);
}

export async function askAccount() {
  const options = [
    { label: 'MM', value: '0' },
    { label: 'RM', value: '1' }
  ];
  return await askFromMenu('Select account:', options);
}
