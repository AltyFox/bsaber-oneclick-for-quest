import QuestAdbUtils from './QuestAdbUtils';
import fetch from './fetch';
import debugLog from './debug-log';
import toast from 'solid-toast';
import progressToast from '../ProgressToast';
import { sleep } from './sleep';
import pLimit from 'p-limit';

const adbUtils = new QuestAdbUtils();
const limit = pLimit(5);

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
  initialize() {
    adbUtils.init();
    toast('BeatSaverUtils initialized');
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
          debugLog(thisProgress);
          progToast.setProgress(thisProgress);
        }
      },
    );
    progToast.setText(`${name} downloaded!  Installing...`);
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

  async installBeatMaps(ids: object) {
    debugLog(ids);
    for (const mapId in ids) {
      const map = ids[mapId];
      const downloadURL = map.versions[0].downloadURL;
      const hash = map.versions[0].hash.toUpperCase();

      limit(async () => {
        const zipName = map.id;
        const zipPath =
          '/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/' +
          zipName;
        if (typeof GM_getValue(zipName) !== 'undefined') {
          toast.success(map.name + ' already installed');
          return;
        }
        GM_setValue(zipName, hash);
        const songData = await this.downloadSong(downloadURL, map.name);
        debugLog(`/sdcard/${map.id}.zip`);
        await adbUtils.writeFile(`/sdcard/${map.id}.zip`, songData.songData);
        sleep(200);
        debugLog(
          `mkdir -p $(dirname '${zipPath}') && unzip -o /sdcard/${zipName}.zip -d '${zipPath}' && sleep 0.5 && unlink /sdcard/${zipName}.zip`,
        );
        const cmd = await adbUtils.runCommand(
          `mkdir -p $(dirname '${zipPath}') && unzip -o /sdcard/${zipName}.zip -d '${zipPath}' && sleep 0.5 && unlink /sdcard/${zipName}.zip`,
        );
        debugLog(cmd);
        debugLog(`Ran for ${zipName}`);

        songData.toast.setText('Installation done: ' + map.name);
      });
    }
  }

  async installPlaylist(url: string) {
    const playlist = await this.getPlaylist(url);
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
      const cachedSong = GM_getValue(songloaderCache[song].sha1);
      if (typeof cachedSong === 'undefined')
        GM_setValue(song, songloaderCache[song].sha1);
    }

    const folderList = await (
      await adbUtils.getSync()
    ).readdir(
      '/sdcard/ModData.com.beatgames.beatsaber/Mods/SongLoader/CustomLevels',
    );
    for (const folder of folderList) {
      if (typeof GM_getValue(folder.name) === 'undefined') {
        GM_deleteValue(folder.name);
      }
    }

    for (const song in localCache) {
      songCache.push(localCache[song]);
    }
    this.isCacheInitialized = true;
    console.log(songCache);
    return songCache;
  }
}

export default BeatSaverUtils;
