const {app, BrowserWindow} = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const {spawn} = require('child_process');

let mainWindow;

let nextServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const startNextServer = async () => {
  if (isDev) {
    // nextServer = spawn('yarn dev');
  }
};

app.on('ready', async () => {
  console.log('ready')
  await startNextServer();
  setTimeout(() => {
    createWindow();
  }, 3000); // Adjust the delay time (in milliseconds) if necessary
});

app.on('window-all-closed', () => {
  if (nextServer) {
    nextServer.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async() => {
  if (mainWindow === null) {
      await startNextServer();
  setTimeout(() => {
    createWindow();
  }, 3000);
  }
});
