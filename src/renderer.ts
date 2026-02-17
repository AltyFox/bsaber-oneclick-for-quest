import { ipcRenderer } from 'electron';
import { ADBStatus, QuestConnection } from './types';

const adbStatusElement = document.getElementById('adb-status');
const questSerialInput = document.getElementById('quest-serial') as HTMLInputElement;
const connectButton = document.getElementById('connect-button');

function updateADBStatus(status: ADBStatus) {
    if (adbStatusElement) {
        adbStatusElement.textContent = status === ADBStatus.Present ? 'ADB is installed.' : 'ADB is not installed.';
    }
}

connectButton?.addEventListener('click', async () => {
    const serialNumber = questSerialInput.value;

    if (serialNumber.length !== 14) {
        alert('Please enter a valid 14-character serial number.');
        return;
    }

    const connectionStatus: QuestConnection = await ipcRenderer.invoke('connect-to-quest', serialNumber);
    
    if (connectionStatus.success) {
        alert('Connected to Quest! Please put on your headset and accept the authorization prompt.');
        window.open('http://beatsaver.com', '_blank');
    } else {
        alert('Failed to connect to Quest. Please ensure ADB is working and the device is connected.');
    }
});

ipcRenderer.on('adb-status', (event, status: ADBStatus) => {
    updateADBStatus(status);
});