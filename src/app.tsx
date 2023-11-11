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
//import { encodeUtf8 } from '@yume-chan/adb';
import { Consumable } from '@yume-chan/stream-extra';
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

function addStyle(styleText) {
  const styleElement = document.createElement('style');

  // Set the CSS content for the <style> element
  styleElement.innerHTML = styleText;

  // Append the <style> element to the <head> of the document
  document.head.appendChild(styleElement);
}

addStyle(
  `.notyf,.notyf__toast{box-sizing:border-box}@-webkit-keyframes notyf-fadeinup{0%{opacity:0;transform:translateY(25%)}to{opacity:1;transform:translateY(0)}}@keyframes notyf-fadeinup{0%{opacity:0;transform:translateY(25%)}to{opacity:1;transform:translateY(0)}}@-webkit-keyframes notyf-fadeinleft{0%{opacity:0;transform:translateX(25%)}to{opacity:1;transform:translateX(0)}}@keyframes notyf-fadeinleft{0%{opacity:0;transform:translateX(25%)}to{opacity:1;transform:translateX(0)}}@-webkit-keyframes notyf-fadeoutright{0%{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(25%)}}@keyframes notyf-fadeoutright{0%{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(25%)}}@-webkit-keyframes notyf-fadeoutdown{0%{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(25%)}}@keyframes notyf-fadeoutdown{0%{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(25%)}}@-webkit-keyframes ripple{0%{transform:scale(0) translateY(-45%) translateX(13%)}to{transform:scale(1) translateY(-45%) translateX(13%)}}@keyframes ripple{0%{transform:scale(0) translateY(-45%) translateX(13%)}to{transform:scale(1) translateY(-45%) translateX(13%)}}.notyf{position:fixed;top:0;left:0;height:100%;width:100%;color:#fff;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;pointer-events:none;padding:20px}.notyf__icon--error,.notyf__icon--success{height:21px;width:21px;background:#fff;border-radius:50%;display:block;margin:0 auto;position:relative}.notyf__icon--error:after,.notyf__icon--error:before{content:"";background:currentColor;display:block;position:absolute;width:3px;border-radius:3px;left:9px;height:12px;top:5px}.notyf__icon--error:after{transform:rotate(-45deg)}.notyf__icon--error:before{transform:rotate(45deg)}.notyf__icon--success:after,.notyf__icon--success:before{content:"";background:currentColor;display:block;position:absolute;width:3px;border-radius:3px}.notyf__icon--success:after{height:6px;transform:rotate(-45deg);top:9px;left:6px}.notyf__icon--success:before{height:11px;transform:rotate(45deg);top:5px;left:10px}.notyf__toast{display:block;overflow:hidden;pointer-events:auto;-webkit-animation:.3s ease-in forwards notyf-fadeinup;animation:.3s ease-in forwards notyf-fadeinup;box-shadow:0 3px 7px 0 rgba(0,0,0,.25);position:relative;padding:0 15px;border-radius:2px;max-width:300px;transform:translateY(25%);flex-shrink:0}.notyf__toast--disappear{transform:translateY(0);-webkit-animation:.3s .25s forwards notyf-fadeoutdown;animation:.3s .25s forwards notyf-fadeoutdown}.notyf__toast--disappear .notyf__icon,.notyf__toast--disappear .notyf__message{-webkit-animation:.3s forwards notyf-fadeoutdown;animation:.3s forwards notyf-fadeoutdown;opacity:1;transform:translateY(0)}.notyf__toast--disappear .notyf__dismiss{-webkit-animation:.3s forwards notyf-fadeoutright;animation:.3s forwards notyf-fadeoutright;opacity:1;transform:translateX(0)}.notyf__toast--disappear .notyf__message{-webkit-animation-delay:.05s;animation-delay:.05s}.notyf__toast--upper{margin-bottom:20px}.notyf__toast--lower{margin-top:20px}.notyf__toast--dismissible .notyf__wrapper{padding-right:30px}.notyf__ripple{height:400px;width:400px;position:absolute;transform-origin:bottom right;right:0;top:0;border-radius:50%;transform:scale(0) translateY(-51%) translateX(13%);z-index:5;-webkit-animation:.4s ease-out forwards ripple;animation:.4s ease-out forwards ripple}.notyf__wrapper{display:flex;align-items:center;padding-top:17px;padding-bottom:17px;padding-right:15px;border-radius:3px;position:relative;z-index:10}.notyf__icon{width:22px;text-align:center;font-size:1.3em;opacity:0;-webkit-animation:.3s .3s forwards notyf-fadeinup;animation:.3s .3s forwards notyf-fadeinup;margin-right:13px}.notyf__dismiss{position:absolute;top:0;right:0;height:100%;width:26px;margin-right:-15px;-webkit-animation:.3s .35s forwards notyf-fadeinleft;animation:.3s .35s forwards notyf-fadeinleft;opacity:0}.notyf__dismiss-btn{background-color:rgba(0,0,0,.25);border:none;cursor:pointer;transition:opacity .2s,background-color .2s;outline:0;opacity:.35;height:100%;width:100%}.notyf__dismiss-btn:after,.notyf__dismiss-btn:before{content:"";background:#fff;height:12px;width:2px;border-radius:3px;position:absolute;left:calc(50% - 1px);top:calc(50% - 5px)}.notyf__dismiss-btn:after{transform:rotate(-45deg)}.notyf__dismiss-btn:before{transform:rotate(45deg)}.notyf__dismiss-btn:hover{opacity:.7;background-color:rgba(0,0,0,.15)}.notyf__dismiss-btn:active{opacity:.8}.notyf__message{font-size:.8em;vertical-align:middle;position:relative;opacity:0;-webkit-animation:.3s .25s forwards notyf-fadeinup;animation:.3s .25s forwards notyf-fadeinup;line-height:1.5em}@media only screen and (max-width:480px){.notyf{padding:0}.notyf__ripple{height:600px;width:600px;-webkit-animation-duration:.5s;animation-duration:.5s}.notyf__toast{max-width:none;border-radius:0;box-shadow:0 -2px 7px 0 rgba(0,0,0,.13);width:100%}.notyf__dismiss{width:56px}}`,
);
addStyle(
  `.bsaber-tooltip.-one-click::after {
      content: 'One-Click install to your Quest!';`,
);

class QuestAdbHandler {
  Device: AdbDaemonDevice;
  Connection: AdbDaemonWebUsbConnection;
  CredentialStore: AdbWebCredentialStore;
  AdbTransport: AdbTransport;
  Adb: Adb;
  Sync: AdbSync;
  ActiveTransfer: boolean;
  TransferQueue: [];

  async ProcessQueue() {
    if (this.TransferQueue.length == 0) return;
    if (this.ActiveTransfer == true) return;
    const { zip, transferNotyf, zipPath, originalName } = this.TransferQueue[0];
    let thisFileCount = 0;
    // Use a for...await...of loop to iterate over the zip entries
    for (const [fileName, zipEntry] of Object.entries(zip.files)) {
      this.ActiveTransfer = true;
      console.log(fileName);
      // Use await to pause the execution until the content is ready
      const content = await zipEntry.async('uint8array');
      const file = new ReadableStream({
        start(controller) {
          controller.enqueue(new Consumable(content));
          controller.close();
        },
      });

      const filePath = zipPath + '/' + fileName;

      console.log(thisFileCount);
      const entries = Object.entries(zip.files).length;
      console.log('Transferring ' + filePath);

      (await this.getSync())
        .write({
          filename: filePath,
          file: file,
        })
        .then(() => {
          thisFileCount++;
          console.log(filePath + ' transferred');
          this.TransferQueue.shift();
          setTimeout(() => {
            this.ActiveTransfer = false;
            this.ProcessQueue();
          }, 200);

          if (thisFileCount == entries) {
            notyf.dismiss(transferNotyf);
            notyf.success({
              message: originalName + ' finished transferring!',
              duration: 3000,
            });
          }
        });
    }
  }

  async getDevice() {
    if (!this.Device) {
      this.Device = await Manager.requestDevice();
    }
    console.log(this.Device);
    return this.Device;
  }
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

  async getCredentialStore(): Promise<AdbWebCredentialStore> {
    if (!this.CredentialStore) {
      this.CredentialStore = new AdbWebCredentialStore('beatsaver.com');
    }
    return this.CredentialStore;
  }

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

  async getAdb() {
    if (!this.Adb) {
      this.Adb = await new Adb(await this.getAdbTransport());
    }
    return this.Adb;
  }
  async getSync() {
    if (!this.Sync) {
      const adb = await this.getAdb();
      this.Sync = adb.sync;
    }
    return this.Sync;
  }

  async init() {
    this.ActiveTransfer = false;
    this.TransferQueue = [];
    this.Device = await this.getDevice();
    this.Connection = await this.getConnection();
    this.CredentialStore = await this.getCredentialStore();

    (await this.getCredentialStore()).generateKey().then(async function () {
      console.log('Got Credentials');
    });
  }

  async installBeatmap(bsr) {
    // Define the URL to request
    const url = 'https://api.beatsaver.com/maps/id/' + bsr;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const downloadURL = data.versions[0].downloadURL;
        const originalName = data.name;
        const downloadNotyf = notyf.open({
          type: 'downloading',
          message: 'Downloading ' + originalName,
        });
        fetch(downloadURL)
          .then((response) => response.blob())
          .then((blob) => {
            console.log(this.TransferQueue);
            notyf.dismiss(downloadNotyf);
            const transferNotyf = notyf.open({
              type: 'info',
              message: 'Transfering ' + originalName + ' to device!',
            });
            const zipName = url.substring(url.lastIndexOf('/') + 1);
            const zipPath =
              '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/' +
              zipName;
            const jsZip = new JSZip();
            // Use the JSZip library to read the file contents

            jsZip.loadAsync(blob).then(async (zip) => {
              console.log(zip);
              this.TransferQueue.push({
                zip,
                transferNotyf,
                zipPath,
                originalName,
              });
              this.ProcessQueue();
            });
          });
      });
  }
}
let adbHandler = null;
document.addEventListener('click', async function (event) {
  console.log(event);
  let targetDest;

  if (event.target.parentElement && event.target.parentElement.attributes[0]) {
    if (
      event.target.parentElement.attributes[0].nodeValue.startsWith(
        'beatsaver://',
      )
    ) {
      targetDest = event.target.parentElement.attributes[0].nodeValue;
    }
  }

  if (event.target.attributes[0]) {
    if (event.target.attributes[0].nodeValue.startsWith('beatsaver://')) {
      targetDest = event.target.attributes[0].nodeValue;
    }
  }

  if (event.target.attributes[1]) {
    if (event.target.attributes[1].nodeValue.startsWith('beatsaver://')) {
      targetDest = event.target.attributes[1].nodeValue;
    }
  }

  if (!targetDest) {
    return;
  }

  console.log(targetDest);

  // event.target is the element that was clicked
  // do whatever you want here

  // if you want to prevent the default click action
  // (such as following a link), use these two commands:

  if (targetDest.includes('beatsaver://')) {
    event.stopPropagation();
    event.preventDefault();
    if (!adbHandler) {
      adbHandler = new QuestAdbHandler();
      await adbHandler.init();
    }
    const bsr = targetDest.replace('beatsaver://', '');
    adbHandler.installBeatmap(bsr);
  }
});
