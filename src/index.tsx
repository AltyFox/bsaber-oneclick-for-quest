import BeatSaverUtils from './utils/BeatSaverUtils';
import { Component } from 'solid-js';
import { render } from 'solid-js/web';
import { Toaster } from 'solid-toast';
import debugLog from './utils/debug-log';
import styles, { stylesheet } from './style.module.css';
GM_addStyle(stylesheet);
import './style.css';

const bsUtils = new BeatSaverUtils();

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
      <button class={styles.glowButton} role="button" onClick={connectQuest}>
        &#128279; Click here to enable Quest OneClick
      </button>
    </>
  );
};

render(() => <OneClickInit />, document.body);

// Check if the script handler is not Violentmonkey and if the notice has not been dismissed before
if (
  GM_info.scriptHandler !== 'Violentmonkey' &&
  !localStorage.getItem('violentmonkeyNoticeDismissed')
) {
  // Create the popup elements
  const popup = document.createElement('div');
  popup.id = 'script-notice-popup';
  popup.style.color = 'black';
  popup.style.fontWeight = '1.3em';
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.backgroundColor = 'white';
  popup.style.border = '1px solid black';
  popup.style.padding = '20px';
  popup.style.zIndex = '10000';
  popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  popup.style.maxWidth = '80%';
  popup.style.textAlign = 'center';

  const message = document.createElement('p');
  message.textContent = `For better compatibility, we recommend using Violentmonkey instead of ${GM_info.scriptHandler} for the OneClick for Quest installer.
  You will not see this notice again after dismissing it.`;
  popup.appendChild(message);

  const button = document.createElement('button');
  button.textContent = 'Dismiss';
  button.style.marginTop = '10px';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#007BFF';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.addEventListener('click', function () {
    localStorage.setItem('violentmonkeyNoticeDismissed', 'true');
    document.body.removeChild(popup);
  });

  popup.appendChild(button);
  document.body.appendChild(popup);
}
