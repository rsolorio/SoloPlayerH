"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var remoteMain = require("@electron/remote/main");
var url = require("url");
var path = require("path");
var mainWindow = null;
// Detect serve mode (Development mode)
var args = process.argv.slice(1);
var serve = args.some(function (val) { return val === '--serve'; });
remoteMain.initialize();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });
    mainWindow.maximize();
    remoteMain.enable(mainWindow.webContents);
    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(__dirname + "/node_modules/electron")
        });
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.show();
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, "/dist/SoloPlayerH/index.html"),
            protocol: 'file',
            slashes: true
        }));
    }
    // mainWindow.setMenuBarVisibility(false);
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electron_1.app.whenReady().then(function () {
        createWindow();
        electron_1.app.on('activate', function () {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
            electron_1.ipcMain.handle('openFolderDialog', function (e, options) {
                options = options ? options : {};
                options.properties = ['openDirectory'];
                return electron_1.dialog.showOpenDialogSync(options);
            });
            electron_1.ipcMain.handle('openDevTools', function () {
                mainWindow.webContents.openDevTools();
            });
        });
        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        electron_1.app.on('window-all-closed', function () {
            if (process.platform !== 'darwin') {
                electron_1.app.quit();
            }
        });
    });
}
catch (e) {
    console.log(e);
}
