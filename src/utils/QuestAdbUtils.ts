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
import toast from 'solid-toast';
//import debugLog from './debug-log';

class QuestAdbUtils {
  Device: AdbDaemonDevice;
  Connection: AdbDaemonWebUsbConnection;
  CredentialStore: AdbWebCredentialStore;
  AdbTransport: AdbTransport;
  Adb: Adb;
  Sync: AdbSync;
  Manager: AdbDaemonWebUsbDeviceManager;
  s;
  constructor() {
    this.Device = null;
    this.Connection = null;
    this.CredentialStore = null;
    this.AdbTransport = null;
    this.Adb = null;
    this.Sync = null;
    this.Manager = null;
  }

  popupError() {
    toast.error(
      `An ADB instance on your computer is currently running, or you did not allow the debugging prompt inside your headset.
      Close SideQuest and QuestPatcher before continuing, then run 
      "taskkill /f /im adb.exe"
      from the Run dialog box.
      (Win+R on your keyboard)
      
      If you're on Linux or macOS, run 
      "killall adb*"
      from your terminal
      Once that's done, please refresh the page and try again.
      Ensure that you "Always Allow" the prompt inside your headset after clicking "Connect" on the left side.
      `,
      {
        duration: 10000000,
      },
    );
  }

  async getManager() {
    if (!this.Manager) {
      this.Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
    }
    return await this.Manager;
  }
  async getDevices() {
    return (await this.getManager()).getDevices();
  }

  // Define a function to get the connected device
  async getDevice() {
    if (!this.Device) {
      this.Device = await (await this.getManager()).requestDevice();
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
    try {
      this.Device = await this.getDevice();
      this.Connection = await this.getConnection();
      this.CredentialStore = await this.getCredentialStore();
      this.Adb = await this.getAdb();
      this.Sync = await this.getSync();
      this.Manager = await this.getManager(); // Await the getManager() method call
    } catch {
      this.popupError();
    }
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

  async readFile(path: string) {
    const content = (await this.getSync()).read(path);
    const chunks: Array<string> = [];
    await content.pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(chunk);
        },
      }),
    );
    const concatenated = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0),
    );
    let offset = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }
    const text = new TextDecoder().decode(concatenated);
    return text;
  }

  isWriting = false; // Flag variable to track active write

  async writeFile(path: string, content: Blob) {
    if (this.isWriting) {
      // If there is an active write, wait for it to complete
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!this.isWriting) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    this.isWriting = true; // Set the flag to indicate active write

    let fileData;
    this.toArray(content, async (array) => {
      fileData = new ReadableStream({
        start(controller) {
          controller.enqueue(new Consumable(array));
          controller.close();
        },
      });
      await (
        await this.getSync()
      ).write({
        filename: path,
        file: fileData,
      });

      this.isWriting = false; // Reset the flag after write is complete
    });
  }

  async readDir(path: string) {
    (await this.getSync()).readdir(path);
  }

  async runCommand(command: string) {
    const cmdProc = await (await this.getAdb()).subprocess.spawn(command);
    let output = '';
    await cmdProc.stdout.pipeThrough(new DecodeUtf8Stream()).pipeTo(
      new WritableStream<string>({
        write(chunk) {
          output += chunk;
        },
      }),
    );
    await cmdProc.exit;
    return output;
  }

  toArray = (blob, callback) => {
    const promise = blob.arrayBuffer();
    promise.then((buffer) => callback(new Uint8Array(buffer)));
  };
}

export default QuestAdbUtils;
