# BSaber OneClick for Quest

Userscript for Beat Saber OneClick support for Quest users.

Works via WebUSB using [@yume-chan/adb](https://www.npmjs.com/package/@yume-chan/adb)

Make sure there are no running ADB instances on your computer by running `adb kill-server`.

Note, SideQuest, and QuestPatcher spawn ADB instances.  Ensure these are closed.

Connect your Quest to your computer.

Requires Tampermonkey, or some other UserScript browser plugin.

https://bsquest.xyz/bsaber_oneclick/index.user.js

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
