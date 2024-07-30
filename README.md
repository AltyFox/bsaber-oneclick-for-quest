# BSaber OneClick for Quest
Userscript for Beat Saber OneClick support on [BeatSaver](https://beatsaver.com).
This Script lets you install songs and playlists onto your Quest 1, 2, 3 and Pro with BeatSavers Oneclick feature.

Works via WebUSB using [@yume-chan/adb](https://www.npmjs.com/package/@yume-chan/adb)

## Installing

Note, SideQuest, and QuestPatcher spawn ADB instances.  Ensure these are closed.

Make sure there are no running ADB instances on your computer by running this command from your run dialog (Win+R)

`taskkill /f /im adb*`.

No need to run this command if you haven't used ADB since you've logged into your computer.

Connect your Quest to your computer.

Requires Violentmonkey for best compatibility, or some other UserScript browser plugin. 

Once Violentmonkey or an equivalent UserScript plugin is installed, [please click here to install the userscript](https://github.com/AltyFox/bsaber-oneclick-for-quest/releases/latest/download/index.user.js)

Once the UserScript is installed, visit http://beatsaver.com and click "Quest OneClick" in the titlebar.

This is a userscript initiated from [@violentmonkey/generator-userscript](https://github.com/violentmonkey/generator-userscript).
