import BeatSaverUtils from './utils/BeatSaverUtils';

const bsUtils = new BeatSaverUtils();
bsUtils
  .getPlaylist('https://api.beatsaver.com/playlists/id/221509/download')
  .then((data) => {
    const keys = data.songs.map((song) => song.key);
    const keysString = keys.join(',');
    bsUtils.getBeatMaps(keysString).then((maps) => {
      console.log(Object.entries(maps));
    });
  });
