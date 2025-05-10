import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


let captchaCode = '';

async function createWindow() {
  //console.log('Creating Electron window...');
  // Create the Electron window
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  const captchaImagePath = path.join(__dirname, 'captcha_screenshot.png');

  const imageUrl = `file://${captchaImagePath.replace(/\\/g, '/')}`;

  // Load the captcha page in the Electron window
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <html>
      <body>
        <h2>Please solve the captcha</h2>
        <img src="${imageUrl}" alt="Captcha">
        <input type="text" id="captcha-input" placeholder="Enter captcha" />
        <button id="submit-captcha">Submit</button>

        <script>
          const { ipcRenderer } = require('electron');

          // Focus the captcha input immediately
        window.onload = function() {
          document.getElementById('captcha-input').focus();
        }

          // When Enter is pressed, simulate the click of the submit button
          document.getElementById('captcha-input').addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
              document.getElementById('submit-captcha').click();
            }
          });

          // When the Submit button is clicked
          document.getElementById('submit-captcha').onclick = function() {
            const captcha = document.getElementById('captcha-input').value;
            ipcRenderer.send('captcha-solved', captcha);
          }
        </script>
      </body>
    </html>
  `));

  ipcMain.on('captcha-solved', (event, captcha) => {
    captchaCode = captcha;
    //console.log(`✅ Captcha solved: ${captchaCode}`);

    // Write the captcha code to a text file
    fs.writeFileSync('captcha_code.txt', captchaCode, 'utf8', (err) => {
      if (err) {
        console.error('❌ Error writing captcha code to file:', err);
      } else {
        //console.log('✅ Captcha code written to file');
      }
    });

    // Close the window after captcha is solved
    win.close();
  });
}

app.on('ready', () => {
  //console.log('Electron app is ready!');
  createWindow();
});

app.on('window-all-closed', () => {
  //console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  //console.log('Electron app is quitting...');
});
