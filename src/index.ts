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
import { Consumable, DecodeUtf8Stream } from '@yume-chan/stream-extra';

//import { encodeUtf8 } from '@yume-chan/adb';
import Toastify from 'toastify-js';
const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;

GM_addStyle(
  `/*!
  * Toastify js 1.12.0
  * https://github.com/apvarun/toastify-js
  * @license MIT licensed
  *
  * Copyright (C) 2018 Varun A P
  */.toast-close,.toastify{color:#fff;cursor:pointer}.toastify{padding:12px 20px;display:inline-block;box-shadow:0 3px 6px -1px rgba(0,0,0,.12),0 10px 36px -4px rgba(77,96,232,.3);background:-webkit-linear-gradient(315deg,#73a5ff,#5477f5);background:linear-gradient(135deg,#73a5ff,#5477f5);position:fixed;opacity:0;transition:.4s cubic-bezier(.215, .61, .355, 1);border-radius:2px;text-decoration:none;max-width:calc(50% - 20px);z-index:2147483647}.toastify.on{opacity:1}.toast-close{background:0 0;border:0;font-family:inherit;font-size:1em;opacity:.4;padding:0 5px}.toastify-right{right:15px}.toastify-left{left:15px}.toastify-top{top:-150px}.toastify-bottom{bottom:-150px}.toastify-rounded{border-radius:25px}.toastify-avatar{width:1.5em;height:1.5em;margin:-7px 5px;border-radius:2px}.toastify-center{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content;max-width:-moz-fit-content}@media only screen and (max-width:360px){.toastify-left,.toastify-right{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content}}
  .bsaber-tooltip.-one-click::after {
    content: 'One-Click install to your Quest!';`,
);

const downloadingCSS = 'darkorange';
const completeCSS = 'green';

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
  ActiveDownloadCount: number;
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
    const { blob, zipPath, originalName, bsr, playlistCount = '' } = transfer;

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
          const extractProc = await (
            await self.getAdb()
          ).subprocess.spawn(
            "mkdir -p $(dirname '" +
              zipPath +
              "') 2>/dev/null && unzip -o /sdcard/" +
              bsr +
              ".zip -d '" +
              zipPath +
              "' && unlink /sdcard/" +
              bsr +
              '.zip',
          );

          await extractProc.stdout.pipeThrough(new DecodeUtf8Stream()).pipeTo(
            new WritableStream<string>({
              write(chunk) {
                console.log(chunk);
              },
            }),
          );

          // Set a timeout to reset the active transfer flag and process the queue after a delay
          setTimeout(() => {
            this.ActiveTransfer = false;
            self.ProcessQueue();
          }, 500);

          Toastify({
            text:
              playlistCount +
              ' ' +
              originalName +
              ' finished transferring to device.',
            duration: 2000,
            newWindow: true,
            close: false,
            gravity: 'bottom', // `top` or `bottom`
            position: 'right', // `left`, `center` or `right`
            stopOnFocus: false, // Prevents dismissing of toast on hover
            style: {
              background: completeCSS,
            },
            onClick: function () {}, // Callback after click
          }).showToast();
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
    this.ActiveDownloadCount = 0;

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
        for (let i = 0; i < data.songs.length; i++) {
          const song = data.songs[i];
          console.log(song);
          const songBsr = song.key;
          // Do something with the song hash here
          //
          await new Promise<void>((resolve) => {
            const checkDownloadStatus = () => {
              console.log(self.ActiveDownloadCount);
              if (self.ActiveDownloadCount < 5) {
                clearInterval(intervalId);
                resolve();
              }
            };
            const intervalId = setInterval(checkDownloadStatus, 100);
          });

          const playlistCount = `${i + 1}/${data.songs.length}`;
          await this.installBeatmap(songBsr, playlistCount);
        }
      },
    });
  }
  async installBeatmap(bsr, playlistCount = '') {
    // Define the URL to request
    const url = 'https://api.beatsaver.com/maps/id/' + bsr;
    console.log(url);
    this.ActiveDownloadCount++;

    // Send a GET request to the URL and extract the download URL and original name from the response
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      responseType: 'json',

      onload: (response) => {
        const data = response.response;
        const downloadURL = data.versions[0].downloadURL;
        const originalName = data.name;
        const downloadToast = Toastify({
          text: playlistCount + ' Downloading ' + originalName,
          duration: 0,
          newWindow: true,
          close: false,
          gravity: 'bottom', // `top` or `bottom`
          position: 'right', // `left`, `center` or `right`
          stopOnFocus: false, // Prevents dismissing of toast on hover
          style: {
            background: downloadingCSS,
          },
          onClick: function () {}, // Callback after click
        });
        downloadToast.showToast();

        GM_xmlhttpRequest({
          method: 'GET',
          url: downloadURL,
          responseType: 'blob',
          onprogress: (event) => {
            const progress = Math.round((event.loaded / event.total) * 100);
            downloadToast.toastElement.innerText = `${playlistCount} Downloading ${originalName} ${progress}%`;
          },
          onload: (response) => {
            this.ActiveDownloadCount--;
            const blob = response.response;

            // Dismiss the downloading notification and display a transfer notification
            downloadToast.hideToast();

            // Add the beatmap file to the transfer queue and process the queue
            const zipName = url.substring(url.lastIndexOf('/') + 1);
            const zipPath =
              '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/' +
              zipName;
            this.TransferQueue.push({
              blob,
              zipPath,
              originalName,
              bsr,
              playlistCount,
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

document.addEventListener('click', async function (event) {
  let targetDest;

  const val1 = event.target.parentElement?.attributes[0]?.value;
  const val2 = event.target.attributes[0]?.nodeValue;
  const val3 = event.target.attributes[1]?.nodeValue;
  const val4 = event.target.href;

  const check1 = 'beatsaver://';
  const check2 = 'bsplaylist://playlist/';
  const check3 = 'https://api.beatsaver.com/playlists/id/';

  if (val1) {
    if (val1.startsWith(check1)) {
      targetDest = val1;
    } else if (val1.startsWith(check2)) {
      targetDest = val1;
    } else if (val1.startsWith(check3)) {
      targetDest = val1;
    }
  }

  if (val2) {
    if (val2.startsWith(check1)) {
      targetDest = val2;
    } else if (val2.startsWith(check2)) {
      targetDest = val2;
    } else if (val2.startsWith(check3)) {
      targetDest = val2;
    }
  }

  if (val3) {
    if (val3.startsWith(check1)) {
      targetDest = val3;
    } else if (val3.startsWith(check2)) {
      targetDest = val3;
    } else if (val3.startsWith(check3)) {
      targetDest = val3;
    }
  }

  if (val4) {
    if (val4.startsWith(check1)) {
      targetDest = val4;
    } else if (val4.startsWith(check2)) {
      targetDest = val4;
    } else if (val4.startsWith(check3)) {
      targetDest = val4;
    } else if (val4.endsWith('.bplist')) {
      targetDest = val4;
    }
  }

  console.log(targetDest);
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
  console.log(targetDest);
  // Extract the beatmap ID or playlist ID from the beatsaver or bsplaylist URL and install the beatmap or playlist
  if (targetDest.startsWith('beatsaver://')) {
    const bsr = targetDest.replace('beatsaver://', '');
    adbHandler.installBeatmap(bsr);
  } else if (targetDest.startsWith('bsplaylist://')) {
    const playlistUrl = targetDest.replace('bsplaylist://playlist/', '');
    adbHandler.installPlaylist(playlistUrl);
  } else if (targetDest.startsWith('https://api.beatsaver.com/playlists/id/')) {
    adbHandler.installPlaylist(targetDest);
  } else if (targetDest.endsWith('.bplist')) {
    adbHandler.installPlaylist(targetDest);
  }
});
