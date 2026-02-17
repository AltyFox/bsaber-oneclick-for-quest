# Electron ADB Checker

## Overview
Electron ADB Checker is an Electron application designed to verify the presence of Android Debug Bridge (ADB) on the user's system. If ADB is not found, the application will automatically download it for the user. The app also facilitates connecting to the user's Quest device and provides a seamless experience for accessing BeatSaver.

## Features
- Checks for the presence of ADB on the user's system.
- Automatically downloads ADB if it is missing (Windows).
- Prompts the user to install ADB on Linux systems.
- Connects to the user's Quest device.
- Loads the BeatSaver website for easy access.

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/electron-adb-checker.git
   ```
2. Navigate to the project directory:
   ```
   cd electron-adb-checker
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage
To run the application, use the following command:
```
npm start
```

## Development
- The main entry point for the application is located in `src/main.ts`.
- The renderer process is managed in `src/renderer.ts`.
- Utility functions related to ADB can be found in `src/utils/adb.ts`.
- TypeScript interfaces and types are defined in `src/types/index.ts`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.