import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import axios from 'axios';
import AdmZip from 'adm-zip';

const ADB_URLS = {
    win32: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
    darwin: 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip',
    linux: 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip',
};

const ADB_NAME = process.platform === 'win32' ? 'adb.exe' : 'adb';
const ADB_BASE_DIR = join(homedir(), '.electron-adb-checker');
const ADB_EXTRACTED_DIR = join(ADB_BASE_DIR, 'platform-tools');
const ADB_PATH = join(ADB_EXTRACTED_DIR, ADB_NAME);
const CACHE_PATH = join(ADB_BASE_DIR, 'songCache.json');

const getAdbUrl = () => ADB_URLS[process.platform] || ADB_URLS['win32'];

async function loadCache() {
    try {
        const data = await fs.readFile(CACHE_PATH, 'utf8');
        return JSON.parse(data);
    } catch {
        return { songs: {} };
    }
}

async function saveCache(cache) {
    await fs.mkdir(ADB_BASE_DIR, {
        recursive: true,
    });
    await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function checkADB() {
    return new Promise((resolve) => {
        exec(`"${ADB_PATH}" version`, (err) => resolve(!err));
    });
}

async function downloadADB() {
    const { data } = await axios.get(getAdbUrl(), { responseType: 'arraybuffer' });
    await fs.mkdir(ADB_BASE_DIR, {
        recursive: true,
    });
    const zipPath = join(ADB_BASE_DIR, 'platform-tools.zip');
    await fs.writeFile(zipPath, data);

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(ADB_BASE_DIR, true);

    if (process.platform !== 'win32') await fs.chmod(ADB_PATH, 0o755);
    await fs.unlink(zipPath);
}

function connectToQuest(report = () => {}) {
    return new Promise((resolve) => {
        exec(`"${ADB_PATH}" devices`, (err, stdout) => {
            if (err) {
                report('Failed to list devices.', 'error');
                return resolve(false);
            }
            const lines = stdout.split('\n').slice(1);
            const deviceLine = lines.find(
                (l) => l.trim().endsWith('device') || l.trim().endsWith('unauthorized'),
            );
            if (!deviceLine) {
                report('No Quest device detected. Please connect your Quest.', 'error');
                return resolve(false);
            }
            const [serial, status] = deviceLine.split('\t').map((s) => s.trim());
            if (status === 'unauthorized') {
                report('Quest detected but not authorized. Accept prompt on your Quest.', 'error');
                return resolve(false);
            }
            report('Connected to Quest successfully.', 'info');
            resolve(true);
        });
    });
}

// Push a single file
async function pushFile(local, remote) {
    return new Promise((resolve, reject) => {
        exec(`"${ADB_PATH}" push "${local}" "${remote}"`, (err, stdout, stderr) => {
            if (err) reject(stderr);
            else resolve(stdout);
        });
    });
}

// Push a folder
async function pushFolder(local, remote) {
    return new Promise((resolve, reject) => {
        exec(`"${ADB_PATH}" push "${local}" "${remote}"`, (err, stdout, stderr) => {
            if (err) reject(stderr);
            else resolve(stdout);
        });
    });
}

// Detect SongLoader vs SongCore folder
async function getCustomSongsPath() {
    return new Promise((resolve) => {
        exec(
            `"${ADB_PATH}" shell ls /sdcard/ModData/com.beatgames.beatsaber/Mods/`,
            (err, stdout) => {
                if (err) return resolve('SongCore'); // fallback
                if (stdout.includes('SongCore')) resolve('SongCore');
                else resolve('SongLoader');
            },
        );
    });
}

export {
    checkADB,
    downloadADB,
    connectToQuest,
    pushFile,
    pushFolder,
    getCustomSongsPath,
    loadCache,
    saveCache,
    ADB_BASE_DIR,
};
