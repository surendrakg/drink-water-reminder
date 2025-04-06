const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let popupWindow;
let timesDrank = 0; // Global counter

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 510,
    height: 390,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, "water_reminder_icon_02.ico")
  });
  mainWindow.loadFile('index.html');

  ipcMain.on('open-popup', () => {
    if (!popupWindow || popupWindow.isDestroyed()) {
      timesDrank++; // Increment every time the popup is opened
      popupWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        },
        icon: path.join(__dirname, "water_reminder_icon_02.ico"),
        alwaysOnTop: true,
        skipTaskbar: true
      });
      // Pass the counter as a query parameter
      popupWindow.loadFile(path.join(__dirname, "popup.html"), { query: { count: timesDrank } });
      popupWindow.on('closed', () => {
        popupWindow = null;
        if (mainWindow) {
          mainWindow.focus();
        }
        ipcMain.emit('popup-closed');
      });
    }
  });

  ipcMain.on('stop-popup', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
      popupWindow = null;
    }
  });

  ipcMain.on('popup-closed', () => {
    mainWindow.webContents.send('popup-closed');
  });
});