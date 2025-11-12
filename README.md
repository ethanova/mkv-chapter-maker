# mkv-chapter-maker

An Electron application with React and TypeScript.

A tool to create chapters for MKV/video files. Also works on m4b files!

![image](https://github.com/user-attachments/assets/77c25616-170b-4afa-8c33-b982ec63e189)

## Installation

*YOU MUST INSTALL FFMPEG*

- Ensure you have [FFMPEG installed](https://ffmpeg.org/download.html) in one of these places (depending on your OS): https://github.com/ethanova/mkv-chapter-maker/blob/main/src/constants.ts#L1

### Windows
Expand the assets for the [latest release](https://github.com/ethanova/mkv-chapter-maker/releases) and install the setup.exe file.

### Mac
Expand the assets for the [latest release](https://github.com/ethanova/mkv-chapter-maker/releases) and install the setup.dmg file.

### Building from source
- Download/git clone this project.
- Ensure you have node/npm installed.
- Open a terminal at this project's directory and run `npm install`
- Then, depending on your OS, run either `npm run build:win`, `npm run build:mac`, or `npm run build:linux`
- The /dist folder will contain your .exe/.dmg/whatever that you can use to install it

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

## License

This project is licensed under the terms of the [GNU General Public License v3.0 or later](./LICENSE).

See [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html) for more information.
