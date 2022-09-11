import { app, BrowserWindow } from 'electron';
import * as remoteMain from '@electron/remote/main';
import * as url from 'url';
import * as path from 'path';

let mainWindow: BrowserWindow = null;

// Detect serve mode (Development mode)
const args = process.argv.slice(1);
const serve: boolean = args.some(val => val === '--serve');
remoteMain.initialize();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });
  mainWindow.maximize();
  remoteMain.enable(mainWindow.webContents);

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, `/dist/SoloPlayerH/index.html`),
        protocol: 'file',
        slashes: true,
      }),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

try {

  app.on('ready', createWindow);

  app.on('activate', () => {
    if (mainWindow === null) {
      console.log('main window null');
      createWindow();
    }
  });
} catch (e) {
  console.log(e);
}
