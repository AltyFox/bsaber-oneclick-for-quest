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
  async initialize() {
    toast(
      'If this is your first time running, please allow the debugging prompt inside your headset after clicking "Connect" on the left side',
    );
    await adbUtils.init();

    this.getInstalledSongs();
  }

  async downloadSong(url: string, name: string) {
    let thisProgress = 0;
    debugLog('I AM DOWNLOADIG');
    const progToast = progressToast(`Downloading ${name}`);

    const thisMapData = await fetch(
      url,
      { responseType: 'blob' },
      (progress) => {
        if (progress.lengthComputable) {
          const loaded = progress.loaded;
          const total = progress.total;
          const percentage = (loaded / total) * 100;
          thisProgress = Math.round(percentage);
          progToast.setProgress(thisProgress);
        }
      },
    );
    progToast.setText(`${name} downloaded!  Installing...`);
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
    debugLog(ids);
    for (const mapId in ids) {
      const map = ids[mapId];
      const mapNameShort = this.limitString(map.name, 30);
      const downloadURL = map.versions[0].downloadURL;
      const hash = map.versions[0].hash.toUpperCase();

      limit(async () => {
        const zipName = map.id;
        const zipPath =
          '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/' +
          zipName;
        // if (typeof GM_getValue(zipPath) !== 'undefined') {
        //   toast.success(mapNameShort + ' already installed');
        //   await sleep(300);
        //   return;
        // }
        GM_setValue(zipPath, hash);
        const songData = await this.downloadSong(downloadURL, mapNameShort);
        zip.configure({ useWebWorkers: false });
        const zipFileReader = new zip.BlobReader(songData.songData);

        const zipReader = new zip.ZipReader(zipFileReader);

        for (const entry of await zipReader.getEntries()) {
          const blobWriter = new zip.BlobWriter();
          const blob = await entry.getData(blobWriter);

          await adbUtils.writeFile(zipPath + '/' + entry.filename, blob);
        }
        await zipReader.close();

        songData.toast.setText('Installation done: ' + mapNameShort);
      });
    }
  }

  async installPlaylist(url: string) {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const playlist = await this.getPlaylist(url);

    const playlistBlob = new Blob([JSON.stringify(playlist)], {
      type: 'application/json',
    });

    try {
      await adbUtils.writeFile(
        '/sdcard/ModData/com.beatgames.beatsaber/Mods/PlaylistManager/Playlists/' +
          fileName,
        playlistBlob,
      );
    } catch {
      toast.error(
        "Oh no!  You did not allow the ADB prompt inside your headset.   Please put on your headset and 'Always Allow'.  Then please refresh this page and try again",
        { duration: 10000000 },
      );
    }

    const keys = playlist.songs.map((song) => song.key);
    const keysString = keys.join(',');
    const beatMaps = await this.getBeatMaps(keysString);
    this.installBeatMaps(beatMaps);
  }

  async deleteSong() {}

  async getInstalledSongs() {
    const songCache = [];
    const localCache = GM_listValues();
    if (this.isCacheInitialized) {
      for (const song in localCache) {
        songCache.push(localCache[song]);
      }
      return songCache;
    }

    const songloaderCache = JSON.parse(
      await adbUtils.readFile(
        '/sdcard/ModData/com.beatgames.beatsaber/Configs/SongLoader.json',
      ),
    );
    for (const song in songloaderCache) {
      const cachedSong = GM_getValue(song);
      if (typeof cachedSong === 'undefined')
        GM_setValue(song, songloaderCache[song].sha1);
    }

    const folders = await (
      await adbUtils.getSync()
    ).readdir(
      '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels',
    );
    const folderList = [];
    for (const folder in folders) {
      debugLog(folder);
      folderList.push(
        `/sdcard/ModData/com.beatgames.beatsaber.Mods.SongLoader/CustomLevels/${folders[folder].name}`,
      );
    }

    for (const song in localCache) {
      debugLog(folderList);
      debugLog(localCache[song], 'vs', folderList[song]);
      if (typeof folderList[song] === 'undefined') {
        GM_deleteValue(song);
      }
    }

    for (const song in localCache) {
      songCache.push(localCache[song]);
    }
    this.isCacheInitialized = true;
    debugLog(songCache);
    return songCache;
  }
}

export default BeatSaverUtils;
