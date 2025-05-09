const fs = require('fs').promises;
const pathModule = require('path');

module.exports = async function getFolderContentsArray(path) {
    try {
        const files = await fs.readdir(path);
        const fileArray = files.map(file => pathModule.join(path, file));
        return fileArray;
    } catch (err) {
        console.error(`Error reading folder: ${path}`, err);
        return [];
    }
};
