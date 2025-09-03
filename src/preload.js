const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onShowMessage: (callback) => ipcRenderer.on('show-message', (event, data) => callback(data)),
});

window.addEventListener('DOMContentLoaded', () => {
    const isBeatSaver = window.location.hostname.includes('beatsaver.com');

    if (isBeatSaver) {
        // Overlay for beatsaver.com
        const msgContainer = document.createElement('div');
        msgContainer.id = 'electron-messages';
        Object.assign(msgContainer.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            width: '300px',
            maxHeight: '90vh',
            overflowY: 'auto',
            zIndex: 999999,
            fontFamily: 'sans-serif',
        });
        document.body.appendChild(msgContainer);

        ipcRenderer.on('show-message', (event, data) => {
            console.log(data);
            const msgEl = document.createElement('div');
            msgEl.textContent = data.message;
            msgEl.style.margin = '5px';
            msgEl.style.padding = '10px';
            msgEl.style.borderRadius = '5px';
            msgEl.style.color = '#fff';

            if (data.type === 'info') msgEl.style.backgroundColor = '#2196F3';
            else if (data.type === 'success') msgEl.style.backgroundColor = '#4CAF50';
            else if (data.type === 'error') msgEl.style.backgroundColor = '#F44336';
            else msgEl.style.backgroundColor = '#333';

            msgContainer.appendChild(msgEl);

            setTimeout(() => {
                msgContainer.removeChild(msgEl);
            }, 5000);
        });
    } else {
        // Normal page message element logic
        const messageElement = document.getElementById('message');

        ipcRenderer.on('show-message', (event, data) => {
            if (messageElement) {
                messageElement.textContent = data.message;
                messageElement.style.display = 'block';
                messageElement.className = data.type;
            }
        });
    }
});
