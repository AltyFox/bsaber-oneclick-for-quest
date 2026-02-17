import QuestAdbUtils from './QuestAdbUtils';
import fetch from './fetch';
import debugLog from './debug-log';
import toast from 'solid-toast';
import progressToast from '../ProgressToast';
import { sleep } from './sleep';
import pLimit from 'p-limit';
import * as zip from '@zip.js/zip.js';

const adbUtils = new QuestAdbUtils();
const limit = pLimit(3);

const songPath = [
  '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/',
  '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongCore/CustomLevels/',
];

const playlistJson = [
  '/sdcard/ModData/com.beatgames.beatsaber/Configs/SongLoader.json',
  '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongCore/CachedSongData.json',
];

interface Playlist {
  playlistTitle: string;
  playlistAuthor: string;
  image: string;
  customData: object;
  songs: object[];
}

interface BeatMap {
  maps: object[];
  // id: string;
  // name: string;
  // uploader: object;
  // description: string;
  // metadata: object;
  // hash: string;
  // automapper: boolean;
  // stats: object;
}

class BeatSaverUtils {
  isCacheInitialized = false;
  globalSongPath = null;
  globalPlaylistJsonPath = null;

  getInstalledVersion = async () => {
    const dumpsysCommand = 'dumpsys package com.beatgames.beatsaber';
    const dumpsysResult = await adbUtils.runCommand(dumpsysCommand);
    const versionRegex = /versionName=(\S+)/;
    const match = dumpsysResult.match(versionRegex);
    if (match) {
      const installedVersion = match[1];
      console.log(installedVersion);
      return installedVersion;
      // Do something with the installed version
    } else {
      console.log('Unable to retrieve installed version');
      // Handle case when version information is not available
    }
  };

  async sha1(str) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-1', enc.encode(str));
    return Array.from(new Uint8Array(hash))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('');
  }

  async initialize() {
    toast(
      'If this is your first time running, please allow the debugging prompt inside your headset after clicking "Connect" on the left side',
    );
    await adbUtils.init();
    toast.promise(this.getInstalledSongs(), {
      loading: 'Loading installed songs... Please wait before doing anything!',
      success: 'Installed songs loaded!!  You may continue.',
      error: 'Something went wrong',
    });
  }

  async downloadSong(url: string, name: string, plText: string = '') {
    let thisProgress = 0;
    debugLog('I AM DOWNLOADIG');
    const progToast = progressToast(`${plText}Downloading ${name}`);

    const thisMapData = await fetch(
      url,
      { responseType: 'blob' },
      (progress) => {
        debugLog(progress);
        if (progress.lengthComputable) {
          const loaded = progress.loaded;
          const total = progress.total;
          const percentage = (loaded / total) * 100;
          thisProgress = Math.round(percentage);
          progToast.setProgress(thisProgress);
        }
      },
    );
    progToast.setText(`${plText}${name} installing...`);
    setTimeout(() => {
      progToast.dismiss();
    }, 3000);
    return { songData: thisMapData.response, toast: progToast };
  }

  async getBeatMaps(ids: string): Promise<BeatMap> {
    debugLog('getting beatmaps');
    const chunkSize = 50;
    const idArray = ids.split(',');
    const chunks = [];
    const mergedResponse = {} as BeatMap;

    for (let i = 0; i < idArray.length; i += chunkSize) {
      chunks.push([...idArray.slice(i, i + chunkSize)]);
    }

    for (const chunk of chunks) {
      debugLog("I'M FETCHING");
      const data = await fetch(
        `https://api.beatsaver.com/maps/ids/${chunk.join(',')}`,
      );
      Object.assign(mergedResponse, JSON.parse(data.response as string));

      await sleep(500);
    }

    return mergedResponse;
  }

  getPlaylist(url: string): Promise<Playlist> {
    return fetch(url).then((res) => JSON.parse(res.response as string));
  }

  limitString(str: string, limit: number): string {
    if (str.length <= limit) {
      return str;
    }
    return str.slice(0, limit) + '...';
  }

  async installBeatMaps(ids: object) {
    const numProperties = Object.keys(ids).length;
    let iterCount = 0;

    for (const mapId in ids) {
      const map = ids[mapId];
      const mapNameShort = this.limitString(map.name, 30);
      const downloadURL = map.versions[0].downloadURL;
      const hash = map.versions[0].hash.toUpperCase();

      limit(async () => {
        iterCount = iterCount + 1;
        let plText = '';
        if (numProperties > 1) {
          plText = `${iterCount} / ${numProperties} `;
        }
        const zipName = map.id;
        const zipPath = (await this.getSongPath()) + zipName;
        if (typeof GM_getValue(hash) !== 'undefined') {
          toast.success(`${plText}${mapNameShort} already installed`);
          await sleep(500);
          return;
        }
        GM_setValue(hash, zipPath);
        const songData = await this.downloadSong(
          downloadURL,
          mapNameShort,
          plText,
        );
        zip.configure({ useWebWorkers: false });
        const zipFileReader = new zip.BlobReader(songData.songData);

        const zipReader = new zip.ZipReader(zipFileReader);

        for (const entry of await zipReader.getEntries()) {
          const blobWriter = new zip.BlobWriter();
          const blob = await entry.getData(blobWriter);

          await adbUtils.writeFile(zipPath + '/' + entry.filename, blob);
        }
        await zipReader.close();

        songData.toast.setText(`${plText}${mapNameShort} installed!`);
      });
    }
  }

  async installPlaylist(url: string) {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const playlist = await this.getPlaylist(url);

    const playlistBlob = new Blob([JSON.stringify(playlist)], {
      type: 'application/json',
    });

    await adbUtils.writeFile(
      '/sdcard/ModData/com.beatgames.beatsaber/Mods/PlaylistManager/Playlists/' +
        fileName,
      playlistBlob,
    );

    const keys = playlist.songs.map((song) => song.key);
    const keysString = keys.join(',');
    const beatMaps = await this.getBeatMaps(keysString);
    this.installBeatMaps(beatMaps);
  }

  async getSongHash(path: string) {
    const files = await (await adbUtils.getSync()).readdir(path);
    const fileList = [];
    for (const file of files) {
      fileList.push(path + '/' + file.name);
    }
    let infoContents: string;
    const diffFilenames = [];

    // Step 1: Read the contents of the "info.dat" file
    for (const file of fileList) {
      if (file.toLowerCase().endsWith('/info.dat')) {
        infoContents = await adbUtils.readFile(file);
        debugLog(file);
        break;
      }
    }

    // Step 2: Extract filenames of "diff.dat" files
    if (infoContents) {
      const infoData = JSON.parse(infoContents);
      if (infoData._difficultyBeatmapSets) {
        for (const set of infoData._difficultyBeatmapSets) {
          for (const diff of set._difficultyBeatmaps) {
            diffFilenames.push(diff._beatmapFilename);
          }
        }
      }
    }

    // Step 3 and 4: Read and concatenate contents of "diff.dat" files
    let combinedContents = infoContents;
    for (const diffFile of diffFilenames) {
      const diffContent = await adbUtils.readFile(path + '/' + diffFile);
      combinedContents += diffContent;
    }

    return (await this.sha1(combinedContents)).toUpperCase();
  }

  async getPlaylistJsonPath() {
    if (this.globalPlaylistJsonPath) {
      return this.globalPlaylistJsonPath;
    }
    const installedVersion = await this.getInstalledVersion();
    if (installedVersion && parseFloat(installedVersion) >= 1.35) {
      this.globalPlaylistJsonPath = playlistJson[1];
    } else {
      this.globalPlaylistJsonPath = playlistJson[0];
    }
    return this.globalPlaylistJsonPath;
  }

  async getSongPath() {
    if (this.globalSongPath) {
      console.log(this.globalSongPath);
      return this.globalSongPath;
    }
    const installedVersion = await this.getInstalledVersion();
    if (installedVersion && parseFloat(installedVersion) >= 1.35) {
      this.globalSongPath = songPath[1];
    } else {
      this.globalSongPath = songPath[0];
    }
    console.log(this.globalSongPath);
    return this.globalSongPath;
  }

  async getInstalledSongs() {
    const songCache = [];
    let localCache = GM_listValues();
    if (this.isCacheInitialized) {
      for (const song in localCache) {
        songCache.push(localCache[song]);
      }
      return songCache;
    }

    const songloaderCache = JSON.parse(
      await adbUtils.readFile(await this.getPlaylistJsonPath()),
    );
    for (const song in songloaderCache) {
      const cachedSong = GM_getValue(songloaderCache[song].sha1);
      if (typeof cachedSong === 'undefined')
        GM_setValue(songloaderCache[song].sha1, song);
    }
    console.log(await this.getSongPath());
    const folders = await (
      await adbUtils.getSync()
    ).readdir(await this.getSongPath());
    const hashList = [];
    for (const folder in folders) {
      const songPath = `${await this.getSongPath()}${folders[folder].name}`;
      if (songloaderCache[songPath]) {
        hashList.push(songloaderCache[songPath].sha1);
      } else {
        let isCached = false;
        for (const index in localCache) {
          const localValue = GM_getValue(localCache[index]);
          if (localValue == songPath) {
            debugLog('Local cache found of missing Quest cache: ', index);
            isCached = true;
            hashList.push(index);
          }
        }
        if (!isCached) {
          const newSongHash = await this.getSongHash(songPath);
          GM_setValue(newSongHash, songPath);
          hashList.push(newSongHash);
        }
      }
    }

    localCache = GM_listValues();
    for (const index in localCache) {
      const thisHash = localCache[index];
      const thisPath = GM_getValue(thisHash);
      let found = false;
      for (const folder in folders) {
        const songPath = `${await this.getSongPath()}${folders[folder].name}`;
        if (thisPath == songPath) {
          found = true;
          debugLog('FOUND');
        }
      }

      if (!found) {
        debugLog(thisPath);
        debugLog('Local cache found that was not on headset!  Removing');
        GM_deleteValue(thisHash);
      }
    }
    localCache = GM_listValues();
    for (const hash in localCache) {
      songCache.push(localCache[hash]);
    }
    this.isCacheInitialized = true;
    debugLog(songCache);
    return songCache;
  }
}

export default BeatSaverUtils;
