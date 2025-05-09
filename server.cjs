const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { replaceManifestCanvases, createManifestFromFiles } = require('./utilities/manifestCreation.cjs');
const Store = require('electron-store');
const fs = require('fs');
const fsPromises = require('fs/promises');
const store = new Store();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'appico', 'icon.ico') // or .ico for Windows
  })
  win.loadFile(path.join(__dirname, '/dist/index.html'))
  ipcMain.handle('createManifestFromFiles', handleCreateManifestFromFiles)
  ipcMain.handle('replaceManifestCanvasesFromFolder', handleReplaceManifestCanvases)
  ipcMain.handle('openFile', handleOpenFile)
  ipcMain.handle('setWipPath', handleSetWipPath)
  ipcMain.handle('getWipPath', handleGetWipPath)
  ipcMain.handle('setMetadataProfile', handleSetMetadataProfile)
  ipcMain.handle('getMetadataProfile', handleGetMetadataProfile)
  ipcMain.handle('relabelCanveses', handleRelabelCanveses)
  ipcMain.handle('saveManifest', handleSaveManifest)
}
const handleSetWipPath = async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
    const folderPath = result.filePaths[0].replace(/\\/g, '/');
    store.set('wipPath', folderPath);
    return folderPath;
  }
  return await handleGetWipPath();
};

const handleGetWipPath = async () => {
  const wipPath = store.get('wipPath');
  return wipPath || 'No WIP folder set.';
};

const handleSetMetadataProfile = async (event, data) => {
  try {
    data.metadata = data.metadata?.filter((field) => {
      return !(field.label?.en?.[0] === 'Slug');
    }) ?? [];

    const metadataArray = JSON.stringify(data.metadata);
    store.set('metadataProfile', metadataArray);

    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Success',
      message: 'The Metadata Profile has been saved!'
    });
  } catch (e) {
    console.error('Error setting metadata profile:', e);
    dialog.showErrorBox('Error', 'Could not set metadata profile.');
  }
};

const handleGetMetadataProfile = async (event, data) => {
  try {
    const metadataString = store.get('metadataProfile');
    const metadataArray = JSON.parse(metadataString);

    for (const field of data.metadata) {
      if (field.label?.en?.[0] === 'Slug') {
        metadataArray.unshift(field);
      }
    }
    return metadataArray;
  } catch (e) {
    console.error('Error getting metadata profile:', e);
    dialog.showErrorBox('Error', 'Could not get metadata profile.');
  }
};

const handleReplaceManifestCanvases = async (event, data) => {
  try {
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    if (!filePaths.length) return;
    const manifest = await replaceManifestCanvases(filePaths, data);
    return manifest;
  } catch (e) {
    console.error('Error selecting folder:', e);
    dialog.showErrorBox('Error', 'Could not select folder.');
  }
};

const handleCreateManifestFromFiles = async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    if (!filePaths.length) return;
    const manifest = await createManifestFromFiles(filePaths);
    return manifest;
  } catch (e) {
    console.error('Error selecting folder:', e);
    dialog.showErrorBox('Error', 'Could not select folder.');
  }
};

const handleOpenFile = async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Manifest JSON File',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  try {
    const fileData = await fsPromises.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileData);
    return jsonData;
  } catch (error) {
    dialog.showErrorBox('Error', 'Could not read or parse the JSON file.');
    return null;
  }
};

const handleRelabelCanveses = async (event, data) => {
  try {
    const newItems = data.items.map((canvas, index) => ({
      ...canvas,
      label: {
        en: [`Image ${index + 1}`]
      }
    }));
    data.items = newItems;
    return data;
  } catch (e) {
    dialog.showErrorBox('Error', 'There was a problem when re-labeling the canvases.');
  }
};

const handleSaveManifest = async (event, data) => {
  try {
    const wipPath = store.get('wipPath');
    let slug;

    for (const field of data.metadata) {
      if (field.label?.en?.[0] === 'Slug') {
        slug = field.value.en[0];
        break;
      }
    }

    if (!slug) throw new Error('You need to add a Slug metadata element to the metadata array before saving.');

    const filePath = path.join(wipPath, 'crkn-scripting', 'new-manifests', `${slug}.json`);
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Success',
      message: `File saved successfully at: ${filePath}`
    });
    return true;
  } catch (error) {
    dialog.showErrorBox('Error', `There was a problem saving the file. ${error}`);
    return false;
  }
};

// App initialization
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
