import { promises as fs } from 'fs';
import { join, basename } from 'path';
import AdmZip from 'adm-zip';
import axios from 'axios';
import {
    pushFile,
    pushFolder,
    getCustomSongsPath,
    loadCache,
    saveCache,
    ADB_BASE_DIR,
} from './adb.js';

class BeatSaverUtils {
    constructor(reporter = (msg, type = 'info') => {}) {
        this.report = reporter; // store reporter callback
        this.isCacheInitialized = false;
        this.globalSongPath = null;
        this.globalPlaylistJsonPath = null;
    }
    async getBeatMaps(ids) {
        const chunkSize = 50;
        const idArray = ids.split(',');
        const merged = {};

        for (let i = 0; i < idArray.length; i += chunkSize) {
            const chunk = idArray.slice(i, i + chunkSize);
            const { data } = await axios.get(
                `https://api.beatsaver.com/maps/ids/${chunk.join(',')}`,
            );
            Object.assign(merged, data);

            this.report(`Fetched ${Object.keys(merged).length}/${idArray.length} beatmaps...`);
            await new Promise((r) => setTimeout(r, 500));
        }

        return merged;
    }

    async installBeatMaps(ids) {
        const cache = await loadCache();
        const num = Object.keys(ids).length;
        let count = 0;

        for (const mapId in ids) {
            count++;
            const map = ids[mapId];
            const hash = map.versions[0].hash.toUpperCase();

            if (cache.songs[hash]) {
                this.report(`[SKIP] ${map.name} already installed`);
                continue;
            }

            const { data } = await axios.get(map.versions[0].downloadURL, {
                responseType: 'arraybuffer',
            });
            const zip = new AdmZip(data);
            const tmpDir = join(ADB_BASE_DIR, hash);
            await fs.mkdir(tmpDir, {
                recursive: true,
            });
            zip.extractAllTo(tmpDir, true);

            const modType = await getCustomSongsPath();
            const remotePath =
                modType === 'SongLoader'
                    ? `/sdcard/ModData/com.beatgames.beatsaber/Mods/SongLoader/CustomLevels/${hash}`
                    : `/sdcard/ModData/com.beatgames.beatsaber/Mods/SongCore/CustomLevels/${hash}`;

            await pushFolder(tmpDir, remotePath);

            cache.songs[hash] = remotePath;
            await saveCache(cache);

            await fs.rm(tmpDir, {
                recursive: true,
                force: true,
            });
            this.report(`[OK] Installed ${map.name} (${count}/${num})`);
        }
    }

    async installPlaylist(url) {
        const { data: playlist } = await axios.get(url);
        const fileName = basename(url);
        const tmpPlaylistPath = join(ADB_BASE_DIR, fileName);

        await fs.writeFile(tmpPlaylistPath, JSON.stringify(playlist, null, 2));
        await pushFile(
            tmpPlaylistPath,
            `/sdcard/ModData/com.beatgames.beatsaber/Mods/PlaylistManager/Playlists/${fileName}`,
        );
        await fs.unlink(tmpPlaylistPath);

        const keys = playlist.songs.map((s) => s.key).join(',');
        this.report(`Installing ${playlist.songs.length} songs`);
        this.report('Fetching beatmaps...');
        const beatMaps = await this.getBeatMaps(keys);
        this.report(`Found ${Object.keys(beatMaps).length} beatmaps. Installing...`);
        await this.installBeatMaps(beatMaps);
    }
}

export default BeatSaverUtils;
