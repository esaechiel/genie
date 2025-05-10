const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  sendCaptchaSolved: (captcha) => ipcRenderer.send('captcha-solved', captcha),
});
