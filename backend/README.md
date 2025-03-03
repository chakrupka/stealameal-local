### Installation

1. `cd backend && npm install`
2. `npm install`
3. `npm run start

**Note:** If you are using VSCode you may get an eslint error in backend/server.js relating to a babel config file. If you do, do the following:

1. Open your VSCode User Settings JSON file
   - Shortcut: CMD+Shift+P to open command palette, search "user settings", select "Preferences: Open User Settings (JSON)"
2. Add the following rule: `"eslint.workingDirectories": [{ "mode": "auto" }]`
3. Save the file

TODO:
Need to make a .env file (JSON format for )
Need firebase credentials
Need MongoDB credentials