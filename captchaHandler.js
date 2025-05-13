import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const solveCaptcha = () => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, 'solver.py');
    const command = `python3 "${pythonScriptPath}"`; // Use "python3" if needed

    exec(command, (error, stdout) => {
      if (error) {
        console.error(`❌ Python error: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};
