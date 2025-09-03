import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';

const ADB_URLS: Record<NodeJS.Platform, string> = {
    win32: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip',
    darwin: 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip',
    linux: 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip',
};

const getAdbUrl = (): string => {
    return ADB_URLS[process.platform] || ADB_URLS['win32'];
};
const ADB_NAME = process.platform === 'win32' ? 'adb.exe' : 'adb';
const ADB_PATH = path.join(os.homedir(), '.electron-adb-checker', ADB_NAME);

export async function checkADB(): Promise<boolean> {
    return new Promise((resolve) => {
        exec(`${ADB_PATH} version`, (error) => {
            resolve(!error);
        });
    });
}

export async function downloadADB(): Promise<void> {
    const response = await axios.get(getAdbUrl(), { responseType: 'arraybuffer' });
    const adbDir = path.dirname(ADB_PATH);
    
    await fs.mkdir(adbDir, { recursive: true });
    await fs.writeFile(ADB_PATH, response.data);
}

export async function connectToQuest(serialNumber: string): Promise<void> {
    if (serialNumber.length !== 14) {
        throw new Error('Invalid serial number length. It must be 14 characters.');
    }

    exec(`${ADB_PATH} connect ${serialNumber}`, (error) => {
        if (error) {
            console.error('Failed to connect to Quest:', error);
        } else {
            console.log('Connected to Quest successfully.');
        }
    });
}