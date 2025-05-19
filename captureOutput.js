// captureOutput.js

export async function captureOutput(fn) {
  let output = '';

  const originalLog = console.log;
  const originalWrite = process.stdout.write;

  // Override console.log
  console.log = (...args) => {
    output += args.join(' ') + '\n';
  };

  // Override process.stdout.write
  process.stdout.write = (chunk, encoding, callback) => {
    output += chunk;
    if (typeof callback === 'function') callback();
    return true;
  };

  try {
    await fn();
  } finally {
    // Restore originals
    console.log = originalLog;
    process.stdout.write = originalWrite;
  }

  return output;
}
