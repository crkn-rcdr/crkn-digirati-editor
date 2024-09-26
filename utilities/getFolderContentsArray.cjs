var electronFs = require('fs')
/*
 Advanced tutorial: https://jakelunn.medium.com/simple-file-tree-electron-es6-71e8abc2c52
*/
module.exports = function getFolderContentsArray(path) {
    
    var fileArray = []

    // file:///C:/Users/BrittnyLapierre/OneDrive%20-%20Canadian%20Research%20Knowledge%20Network/Pictures/kitten.jpg
    electronFs.readdirSync(path).forEach(file => {
        fileArray.push(`file://${path}/${file}`)
    })

    return fileArray
}