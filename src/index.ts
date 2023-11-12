import {
  AdbDaemonWebUsbConnection,
  AdbDaemonWebUsbDeviceManager,
} from '@yume-chan/adb-daemon-webusb';
import {
  Adb,
  AdbDaemonDevice,
  AdbDaemonTransport,
  AdbSync,
  AdbTransport,
} from '@yume-chan/adb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { Consumable } from '@yume-chan/stream-extra';
//import { encodeUtf8 } from '@yume-chan/adb';
import { Notyf } from 'notyf';
const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;

const notyf = new Notyf({
  dismissible: false,
  duration: 0,
  ripple: true,
  types: [
    {
      type: 'info',
      background: 'darkblue',
    },
    {
      type: 'downloading',
      background: 'darkorange',
    },
  ],
});

GM_addStyle(
  `.notyf,.notyf__toast{box-sizing:border-box}@-webkit-keyframes notyf-fadeinup{0%{opacity:0;transform:translateY(25%)}to{opacity:1;transform:translateY(0)}}@keyframes notyf-fadeinup{0%{opacity:0;transform:translateY(25%)}to{opacity:1;transform:translateY(0)}}@-webkit-keyframes notyf-fadeinleft{0%{opacity:0;transform:translateX(25%)}to{opacity:1;transform:translateX(0)}}@keyframes notyf-fadeinleft{0%{opacity:0;transform:translateX(25%)}to{opacity:1;transform:translateX(0)}}@-webkit-keyframes notyf-fadeoutright{0%{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(25%)}}@keyframes notyf-fadeoutright{0%{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(25%)}}@-webkit-keyframes notyf-fadeoutdown{0%{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(25%)}}@keyframes notyf-fadeoutdown{0%{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(25%)}}@-webkit-keyframes ripple{0%{transform:scale(0) translateY(-45%) translateX(13%)}to{transform:scale(1) translateY(-45%) translateX(13%)}}@keyframes ripple{0%{transform:scale(0) translateY(-45%) translateX(13%)}to{transform:scale(1) translateY(-45%) translateX(13%)}}.notyf{position:fixed;top:0;left:0;height:100%;width:100%;color:#fff;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;pointer-events:none;padding:20px}.notyf__icon--error,.notyf__icon--success{height:21px;width:21px;background:#fff;border-radius:50%;display:block;margin:0 auto;position:relative}.notyf__icon--error:after,.notyf__icon--error:before{content:"";background:currentColor;display:block;position:absolute;width:3px;border-radius:3px;left:9px;height:12px;top:5px}.notyf__icon--error:after{transform:rotate(-45deg)}.notyf__icon--error:before{transform:rotate(45deg)}.notyf__icon--success:after,.notyf__icon--success:before{content:"";background:currentColor;display:block;position:absolute;width:3px;border-radius:3px}.notyf__icon--success:after{height:6px;transform:rotate(-45deg);top:9px;left:6px}.notyf__icon--success:before{height:11px;transform:rotate(45deg);top:5px;left:10px}.notyf__toast{display:block;overflow:hidden;pointer-events:auto;-webkit-animation:.3s ease-in forwards notyf-fadeinup;animation:.3s ease-in forwards notyf-fadeinup;box-shadow:0 3px 7px 0 rgba(0,0,0,.25);position:relative;padding:0 15px;border-radius:2px;max-width:300px;transform:translateY(25%);flex-shrink:0}.notyf__toast--disappear{transform:translateY(0);-webkit-animation:.3s .25s forwards notyf-fadeoutdown;animation:.3s .25s forwards notyf-fadeoutdown}.notyf__toast--disappear .notyf__icon,.notyf__toast--disappear .notyf__message{-webkit-animation:.3s forwards notyf-fadeoutdown;animation:.3s forwards notyf-fadeoutdown;opacity:1;transform:translateY(0)}.notyf__toast--disappear .notyf__dismiss{-webkit-animation:.3s forwards notyf-fadeoutright;animation:.3s forwards notyf-fadeoutright;opacity:1;transform:translateX(0)}.notyf__toast--disappear .notyf__message{-webkit-animation-delay:.05s;animation-delay:.05s}.notyf__toast--upper{margin-bottom:20px}.notyf__toast--lower{margin-top:20px}.notyf__toast--dismissible .notyf__wrapper{padding-right:30px}.notyf__ripple{height:400px;width:400px;position:absolute;transform-origin:bottom right;right:0;top:0;border-radius:50%;transform:scale(0) translateY(-51%) translateX(13%);z-index:5;-webkit-animation:.4s ease-out forwards ripple;animation:.4s ease-out forwards ripple}.notyf__wrapper{display:flex;align-items:center;padding-top:17px;padding-bottom:17px;padding-right:15px;border-radius:3px;position:relative;z-index:10}.notyf__icon{width:22px;text-align:center;font-size:1.3em;opacity:0;-webkit-animation:.3s .3s forwards notyf-fadeinup;animation:.3s .3s forwards notyf-fadeinup;margin-right:13px}.notyf__dismiss{position:absolute;top:0;right:0;height:100%;width:26px;margin-right:-15px;-webkit-animation:.3s .35s forwards notyf-fadeinleft;animation:.3s .35s forwards notyf-fadeinleft;opacity:0}.notyf__dismiss-btn{background-color:rgba(0,0,0,.25);border:none;cursor:pointer;transition:opacity .2s,background-color .2s;outline:0;opacity:.35;height:100%;width:100%}.notyf__dismiss-btn:after,.notyf__dismiss-btn:before{content:"";background:#fff;height:12px;width:2px;border-radius:3px;position:absolute;left:calc(50% - 1px);top:calc(50% - 5px)}.notyf__dismiss-btn:after{transform:rotate(-45deg)}.notyf__dismiss-btn:before{transform:rotate(45deg)}.notyf__dismiss-btn:hover{opacity:.7;background-color:rgba(0,0,0,.15)}.notyf__dismiss-btn:active{opacity:.8}.notyf__message{font-size:.8em;vertical-align:middle;position:relative;opacity:0;-webkit-animation:.3s .25s forwards notyf-fadeinup;animation:.3s .25s forwards notyf-fadeinup;line-height:1.5em}@media only screen and (max-width:480px){.notyf{padding:0}.notyf__ripple{height:600px;width:600px;-webkit-animation-duration:.5s;animation-duration:.5s}.notyf__toast{max-width:none;border-radius:0;box-shadow:0 -2px 7px 0 rgba(0,0,0,.13);width:100%}.notyf__dismiss{width:56px}}
  // Define the tooltip content for the One-Click install button
  // and append it to the DOM
  .bsaber-tooltip.-one-click::after {
    content: 'One-Click install to your Quest!';`,
);

// Define the QuestAdbHandler class
class QuestAdbHandler {
  // Define class properties
  Device: AdbDaemonDevice;
  Connection: AdbDaemonWebUsbConnection;
  CredentialStore: AdbWebCredentialStore;
  AdbTransport: AdbTransport;
  Adb: Adb;
  Sync: AdbSync;
  ActiveTransfer: boolean;
  TransferQueue: [];

  // Define a helper function to convert a Blob to a Uint8Array
  toArray = (blob, callback) => {
    const promise = blob.arrayBuffer();
    promise.then((buffer) => callback(new Uint8Array(buffer)));
  };

  // Define a function to process the transfer queue
  async ProcessQueue() {
    // If the queue is empty or there is an active transfer, return
    if (this.TransferQueue.length == 0) return;
    if (this.ActiveTransfer) return;
    this.ActiveTransfer = true;

    // Set the active transfer flag to true and get the first item in the queue
    const transfer = this.TransferQueue.shift();
    if (!transfer) return;

    // Extract the blob, transfer notification, zip path, and original name from the transfer object
    const { blob, transferNotyf, zipPath, originalName, bsr } = transfer;

    // Convert the blob to a ReadableStream and write it to the device
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.toArray(blob, async (array) => {
      const file = new ReadableStream({
        start(controller) {
          controller.enqueue(new Consumable(array));
          controller.close();
        },
      });
      (await self.getSync())
        .write({
          filename: '/sdcard/' + bsr + '.zip',
          file: file,
        })
        .then(async () => {
          // Unzip the file on the device and delete the temporary file
          await (
            await self.getAdb()
          ).subprocess.spawn(
            "mkdir -p $(dirname '" +
              zipPath +
              "') 2>/dev/null && unzip /sdcard/" +
              bsr +
              ".zip -d '" +
              zipPath +
              "' && unlink /sdcard/" +
              bsr +
              '.zip',
          );

          // Set a timeout to reset the active transfer flag and process the queue after a delay
          setTimeout(() => {
            this.ActiveTransfer = false;
            self.ProcessQueue();
          }, 800);

          // Dismiss the transfer notification and display a success notification
          notyf.dismiss(transferNotyf);
          notyf.success({
            message: originalName + ' finished transferring!',
            duration: 3000,
          });
        });
    });
  }

  async getDevices() {
    return await Manager.getDevices();
  }

  // Define a function to get the connected device
  async getDevice() {
    if (!this.Device) {
      this.Device = await Manager.requestDevice();
    }
    return this.Device;
  }

  // Define a function to get the ADB connection
  async getConnection(): Promise<AdbDaemonWebUsbConnection> {
    if (!this.Connection) {
      // await the promise returned by connect() and assign the value to this.Connection
      this.Connection = (
        await this.getDevice()
      ).connect() as AdbDaemonWebUsbConnection;
    }
    // return this.Connection, which will be wrapped in a promise by the async function
    return this.Connection;
  }

  // Define a function to get the ADB credential store
  async getCredentialStore(): Promise<AdbWebCredentialStore> {
    if (!this.CredentialStore) {
      this.CredentialStore = new AdbWebCredentialStore('beatsaver.com');
    }
    return this.CredentialStore;
  }

  // Define a function to get the ADB transport
  async getAdbTransport() {
    if (!this.AdbTransport) {
      this.AdbTransport = await AdbDaemonTransport.authenticate({
        serial: (await this.getDevice()).serial,
        connection: await this.getConnection(),
        credentialStore: await this.getCredentialStore(),
      });
    }
    return this.AdbTransport;
  }

  // Define a function to get the ADB instance
  async getAdb() {
    if (!this.Adb) {
      this.Adb = new Adb(await this.getAdbTransport());
    }
    return this.Adb;
  }

  // Define a function to get the ADB sync instance
  async getSync() {
    if (!this.Sync) {
      const adb = await this.getAdb();
      this.Sync = await adb.sync();
    }
    return this.Sync;
  }

  // Define a function to initialize the class
  async init() {
    // Set the class properties and generate the ADB credentials
    this.TransferQueue = [];
    this.Device = await this.getDevice();
    this.Connection = await this.getConnection();
    this.CredentialStore = await this.getCredentialStore();
    this.Adb = await this.getAdb();
    this.Sync = await this.getSync();

    setInterval(async () => {
      if ((await this.getDevices()).length == 0) {
        this.Device = null;
        this.Connection = null;
        this.CredentialStore = null;
        this.AdbTransport = null;
        this.Adb = null;
        this.Sync = null;
      }
    }, 500);

    (await this.getCredentialStore()).generateKey();
  }

  // Define a function to install a beatmap
  async installPlaylist(playlistUrl) {
    console.log(playlistUrl);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    GM_xmlhttpRequest({
      method: 'GET',
      url: playlistUrl,
      responseType: 'json',
      onload: async (response) => {
        const data = response.response;
        const playlistBlob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });
        this.toArray(playlistBlob, async (array) => {
          const file = new ReadableStream({
            start(controller) {
              controller.enqueue(new Consumable(array));
              controller.close();
            },
          });
          const filename = `/sdcard/ModData/com.beatgames.beatsaber/Mods/PlaylistManager/Playlists/${playlistUrl
            .split('/')
            .pop()}`;
          (await self.getSync()).write({
            filename: filename,
            file: file,
          });
        });
        for (const song of data.songs) {
          console.log(song);
          const songBsr = song.key;
          // Do something with the song hash here
          await new Promise((resolve) => setTimeout(resolve, 500));
          await this.installBeatmap(songBsr);
        }
      },
    });
  }
  async installBeatmap(bsr) {
    // Define the URL to request
    const url = 'https://api.beatsaver.com/maps/id/' + bsr;
    console.log(url);

    // Send a GET request to the URL and extract the download URL and original name from the response
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      responseType: 'json',

      onload: (response) => {
        const data = response.response;
        const downloadURL = data.versions[0].downloadURL;
        const originalName = data.name;

        // Display a downloading notification and send a GET request to the download URL to get the beatmap file
        const downloadNotyf = notyf.open({
          type: 'downloading',
          message: 'Downloading ' + originalName,
        });
        GM_xmlhttpRequest({
          method: 'GET',
          url: downloadURL,
          responseType: 'blob',
          onload: (response) => {
            const blob = response.response;

            // Dismiss the downloading notification and display a transfer notification
            notyf.dismiss(downloadNotyf);
            const transferNotyf = notyf.open({
              type: 'info',
              message: 'Transferring ' + originalName + ' to device!',
            });

            // Add the beatmap file to the transfer queue and process the queue
            const zipName = url.substring(url.lastIndexOf('/') + 1);
            const zipPath =
              '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/' +
              zipName;
            this.TransferQueue.push({
              blob,
              transferNotyf,
              zipPath,
              originalName,
              bsr,
            });
            this.ProcessQueue();
          },
        });
      },
    });
  }
}

// Initialize the adbHandler variable to null
let adbHandler = null;

// Add a click event listener to the document
document.addEventListener('click', async function (event) {
  let targetDest;

  // Check if the clicked element or its parent has a beatsaver or bsplaylist URL
  if (event.target.parentElement && event.target.parentElement.attributes[0]) {
    if (
      event.target.parentElement.attributes[0].nodeValue.startsWith(
        'beatsaver://',
      )
    ) {
      targetDest = event.target.parentElement.attributes[0].nodeValue;
    } else if (
      event.target.parentElement.attributes[0].nodeValue.startsWith(
        'bsplaylist://',
      )
    ) {
      targetDest = event.target.parentElement.attributes[0].nodeValue;
    }
  }

  if (event.target.attributes[0]) {
    if (event.target.attributes[0].nodeValue.startsWith('beatsaver://')) {
      targetDest = event.target.attributes[0].nodeValue;
    } else if (
      event.target.attributes[0].nodeValue.startsWith('bsplaylist://')
    ) {
      targetDest = event.target.attributes[0].nodeValue;
    }
  }

  if (event.target.attributes[1]) {
    if (event.target.attributes[1].nodeValue.startsWith('beatsaver://')) {
      targetDest = event.target.attributes[1].nodeValue;
    } else if (
      event.target.attributes[1].nodeValue.startsWith('bsplaylist://')
    ) {
      targetDest = event.target.attributes[1].nodeValue;
    }
  }

  // If there is no beatsaver or bsplaylist URL, return
  if (!targetDest) {
    return;
  }

  // Prevent the default click action
  event.stopPropagation();
  event.preventDefault();

  // If the adbHandler variable is null, initialize it
  if (!adbHandler) {
    adbHandler = new QuestAdbHandler();
    await adbHandler.init();
  }

  // Extract the beatmap ID or playlist ID from the beatsaver or bsplaylist URL and install the beatmap or playlist
  if (targetDest.startsWith('beatsaver://')) {
    const bsr = targetDest.replace('beatsaver://', '');
    adbHandler.installBeatmap(bsr);
  } else if (targetDest.startsWith('bsplaylist://')) {
    const playlistUrl = targetDest.replace('bsplaylist://playlist/', '');
    adbHandler.installPlaylist(playlistUrl);
  }
});
