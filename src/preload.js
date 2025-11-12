const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const { rename } = require('fs');
const SGDB = require('steamgriddb');

console.log('preload.js loaded');

// contextBridge.exposeInMainWorld('api', {
//   searchGame: async (apiKey, title) => {
//     const sgdbClient = new sgdb(apiKey);
//     return sgdbClient.searchGame(title);
//   },
//   getGrids: async (apiKey, id) => {
//     const sgdbClient = new sgdb(apiKey);
//     return sgdbClient.getGridsById(id);
//   }
// });

contextBridge.exposeInMainWorld('api', {
  launchGame: (launchPath) => {
    // if launchPath starts with steam:// then use start command directly
    if (launchPath.startsWith('steam://')) {
      console.log('launching through steam:', launchPath);
      exec(`start ${launchPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error launching game: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Error output: ${stderr}`);
          return;
        }
        console.log(`Game launched successfully: ${stdout}`);
      });
      return;
    } else {
      console.log('launching:', launchPath);
      ipcRenderer.send('launch-game', launchPath);
    }
    },
    renameFile: (oldPath, newPath) => {
      return new Promise((resolve, reject) => {
        rename(oldPath, newPath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    downloadImage: (imageUrl, savePath) => {
        console.log('downloadImage called with imageUrl:', imageUrl, 'and savePath:', savePath);
        return new Promise((resolve, reject) => {
            const request = https.get(imageUrl, response => {
                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(savePath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                } else {
                    response.resume(); // Consume response data to free up memory
                    reject(new Error(`Request Failed. Status Code: ${response.statusCode}`));
                }
            });

            request.on('error', err => {
                reject(err);
            });

            request.end();
        });
    },
    searchGame: async (apiKey, title) => {
      console.log('searchGame called with apiKey:', apiKey, 'and title:', title);
      try {
        console.log('Importing steamgriddb module...');
        //const { default: SGDB } = await import('steamgriddb');
        console.log('steamgriddb module imported successfully.');
        const sgdbClient = new SGDB(apiKey);
        console.log('Creating SGDB client...');
        const result = await sgdbClient.searchGame(title);
        console.log('searchGame result:', result);
        return result
      } catch (error) {
        console.error('Error in searchGame:', error);
        throw error;
      }
    },
    getGrids: async (apiKey, id) => {
      console.log('getGrids called with apiKey:', apiKey, 'and id:', id);
      try {
        // const { default: SGDB } = await import('steamgriddb');
        const sgdbClient = new SGDB(apiKey);
        const result = await sgdbClient.getGridsById(id);
        console.log('getGrids result:', result);
        return result;
      } catch (error) {
        console.error('Error in getGrids:', error);
        throw error;
      }
    },
    getAppDataPath: () => {
      return ipcRenderer.invoke('get-app-data-path');
    },
    getAssetsPath: () => {
      return ipcRenderer.invoke('get-assets-path');
    },
    readFileSync: (filePath) => {
      return fs.readFileSync(filePath, 'utf-8');
    },
    writeFileSync: (filePath, data) => {
      return fs.writeFileSync(filePath, data, 'utf-8');
    },
    join: (...args) => {
      return path.join(...args);
    },
    existsSync: (filePath, data) => {
      return fs.existsSync
    },
    getDirname: () => {
      return __dirname;
    },
    pathexistsSync: (filePath) => {
      return fs.existsSync(filePath);
    },
    mkdirSync: (dirPath, options) => {
      return fs.mkdirSync(dirPath, options);
    }
  });
