import BeatSaverUtils from './utils/BeatSaverUtils';
import { Component } from 'solid-js';
import { render } from 'solid-js/web';
import { Toaster } from 'solid-toast';
import debugLog from './utils/debug-log';
import './style.css';

const bsUtils = new BeatSaverUtils();
const website = window.location.hostname;
const isBeatSaver = website === 'beatsaver.com';

// bsUtils
//   .getPlaylist('https://api.beatsaver.com/playlists/id/221509/download')
//   .then((data) => {
//     const keys = data.songs.map((song) => song.key);
//     const keysString = keys.join(',');
//     bsUtils.getBeatMaps(keysString).then((maps) => {
//       debugLog(Object.entries(maps));
//     });
//   });

function hijackOneclick() {
  document.addEventListener('click', async function (event) {
    let targetDest;

    const values = [
      (event.target as Element)?.parentElement?.attributes[0]?.value,
      (event.target as Element)?.attributes[0]?.nodeValue,
      (event.target as Element)?.attributes[1]?.nodeValue,
      (event.target as HTMLAnchorElement)?.href,
    ];
    const urlPattern =
      /^(beatsaver:\/\/|bsplaylist:\/\/playlist\/|https:\/\/api.beatsaver.com\/playlists\/id\/).*$/;

    for (const value of values) {
      if (value && urlPattern.test(value)) {
        targetDest = value;
        break;
      }
    }

    // If there is no beatsaver or bsplaylist URL, return
    if (!targetDest) {
      return;
    }

    // Prevent the default click action
    event.stopPropagation();
    event.preventDefault();

    // Extract the beatmap ID or playlist ID from the beatsaver or bsplaylist URL and install the beatmap or playlist
    if (targetDest.startsWith('beatsaver://')) {
      const bsr = targetDest.replace('beatsaver://', '');
      bsUtils.installBeatMaps(await bsUtils.getBeatMaps(bsr));
      debugLog(bsr);
    } else if (targetDest.startsWith('bsplaylist://')) {
      const playlistUrl = targetDest.replace('bsplaylist://playlist/', '');
      debugLog(playlistUrl);
      bsUtils.installPlaylist(playlistUrl);
    } else if (
      targetDest.startsWith('https://api.beatsaver.com/playlists/id/')
    ) {
      debugLog(targetDest);
      bsUtils.installPlaylist(targetDest);
    } else if (targetDest.endsWith('.bplist')) {
      debugLog(targetDest);
      bsUtils.installPlaylist(targetDest);
    }
  });
}

function connectQuest() {
  bsUtils.initialize();
  hijackOneclick();
}

const OneClickInit: Component = () => {
  return (
    <>
      <Toaster />
      <li class="nav-item">
        <a href="#" class="nav-link" onClick={connectQuest}>
          &#128279; Quest OneClick
        </a>
      </li>
    </>
  );
};

render(
  () => <OneClickInit />,
  isBeatSaver
    ? document.querySelector('ul.navbar-nav.me-auto')
    : document.querySelector('#menu-navigation-1'),
);
