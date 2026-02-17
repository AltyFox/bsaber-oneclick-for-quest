import { app, BrowserWindow, ipcMain } from 'electron';
import { checkADB, downloadADB, connectToQuest } from './utils/adb';
import path from 'path';

let mainWindow: BrowserWindow | null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadURL('http://beatsaver.com');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const initializeApp = async () => {
    const adbExists = await checkADB();

    if (!adbExists) {
        const downloadSuccess = await downloadADB();
        if (!downloadSuccess) {
            app.quit();
            return;
        }
    }

    const questConnected = await connectToQuest();
    if (!questConnected) {
        // Prompt user to put on headset and accept authorization
        // This can be handled in the renderer process
    }

    createWindow();
};

app.on('ready', initializeApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});