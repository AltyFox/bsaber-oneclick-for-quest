# BSaber OneClick for Quest

Userscript for Beat Saber OneClick support for Quest users.

Works via WebUSB using [@yume-chan/adb](https://www.npmjs.com/package/@yume-chan/adb)

Note, SideQuest, and QuestPatcher spawn ADB instances.  Ensure these are closed.

Make sure there are no running ADB instances on your computer by running this command from your run dialog (Win+R)

`taskkill /f /im adb*`.

No need to run this command if you haven't used ADB since you've logged into your computer.

Connect your Quest to your computer.

Requires Tampermonkey, or some other UserScript browser plugin.

https://github.com/AltyFox/bsaber-oneclick-for-quest/releases/latest/download/index.user.js

This is a userscript initiated from [@violentmonkey/generator-userscript](https://github.com/violentmonkey/generator-userscript).

## Development

``` sh
# Compile and watch
$ npm run dev

# Build script
$ npm run build

# Lint
$ npm run lint
```
