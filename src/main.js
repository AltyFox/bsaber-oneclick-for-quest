import { app, BrowserWindow } from 'electron';
import { checkADB, downloadADB, connectToQuest } from './utils/adb.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const BeatSaverUtils = (await import('./utils/BeatSaverUtils.js')).default;

let mainWindow = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function shouldIntercept(url) {
    return (
        url.startsWith('beatsaver://') ||
        url.startsWith('bsplaylist://') ||
        url.startsWith('https://api.beatsaver.com/playlists/id/')
    );
}

const showMessage = (message, type = 'info') => {
    if (mainWindow) {
        mainWindow.webContents.send('show-message', { message, type });
    }
};

async function handleInterceptedLink(url) {
    const bsUtils = new BeatSaverUtils(showMessage);

    if (url.startsWith('beatsaver://')) {
        const ids = url.replace('beatsaver://', '');
        try {
            const maps = await bsUtils.getBeatMaps(ids);
            showMessage(`Installing ${Object.keys(maps).length} beatmaps...`);
            await bsUtils.installBeatMaps(maps);
            showMessage(`Installed beatmaps from ${ids}`, 'success');
        } catch (err) {
            showMessage(`Error installing beatmaps: ${err}`, 'error');
        }
    } else if (url.startsWith('bsplaylist://')) {
        const playlistUrl = url.replace('bsplaylist://playlist/', '');
        try {
            showMessage('Installing selected playlist...');
            await bsUtils.installPlaylist(playlistUrl);
            showMessage('Installed playlist!', 'success');
        } catch (err) {
            showMessage(`Error installing playlist: ${err}`, 'error');
        }
    } else if (url.startsWith('https://api.beatsaver.com/playlists/id/')) {
        try {
            showMessage('Installing playlist...');
            await bsUtils.installPlaylist(url);
            showMessage('Installed playlist!', 'success');
        } catch (err) {
            showMessage(`Error installing playlist: ${err}`, 'error');
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });
    mainWindow.loadFile(join(__dirname, 'index.html'));

    // Intercept navigation inside the main window
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (shouldIntercept(url)) {
            event.preventDefault();
            handleInterceptedLink(url);
        }
    });

    // Intercept new-window links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (shouldIntercept(url)) {
            handleInterceptedLink(url);
            return {
                action: 'deny',
            }; // prevent new window
        }
        return { action: 'allow' }; // allow normal behavior
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

const initializeApp = async () => {
    createWindow();
    showMessage('Initializing application....', 'info');
    let adbExists = await checkADB();
    if (!adbExists) {
        try {
            await downloadADB();
            adbExists = await checkADB();
        } catch {
            showMessage('Failed to download or install ADB.', 'error');
            return;
        }
    }

    let questConnected = false;
    try {
        questConnected = await connectToQuest((msg, type) => {
            showMessage(msg, type);
        });
    } catch {
        showMessage('Failed to connect to Quest.', 'error');
        return;
    }

    if (questConnected) {
        mainWindow?.loadURL('http://beatsaver.com');
    } else {
        showMessage('Please connect your Quest and accept the authorization prompt.', 'error');
        const retryConnect = async () => {
            try {
                const connected = await connectToQuest((msg, type) => {
                    showMessage(msg, type);
                });
                if (connected) {
                    mainWindow?.loadURL('http://beatsaver.com');
                } else {
                    setTimeout(retryConnect, 1000);
                }
            } catch {
                showMessage('Failed to connect to Quest.', 'error');
                setTimeout(retryConnect, 1000);
            }
        };
        setTimeout(retryConnect, 1000);
    }
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
