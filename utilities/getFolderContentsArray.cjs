let electronFs = require('fs')
/*
 Advanced tutorial: https://jakelunn.medium.com/simple-file-tree-electron-es6-71e8abc2c52
*/
module.exports = function getFolderContentsArray(path) {
    let fileArray = []
    electronFs.readdirSync(path).forEach(file => {
        fileArray.push(`${path}/${file}`)
    })
    return fileArray
}