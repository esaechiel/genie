export async function pressAnyKeyToContinue() {
    return new Promise(resolve => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdout.write('\nPress any key to continue...\n');
  
      const onKeyPress = () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onKeyPress);
        process.stdout.write('\x1b[1A'); // Move cursor up
        process.stdout.write('\x1b[2K'); // Clear the entire line
        resolve();
      };
  
      process.stdin.on('data', onKeyPress);
    });
  }