const Store = require('electron-store')
const store = new Store()
store.clear()

let setManifest = (data) => {
    let id = data["id"].replace(/\./g, '\\.')
    store.set(id, JSON.stringify(data))
}

let getManifest = (id) => {
    id = id.replace(/\./g, '\\.')
    return JSON.parse(store.get(id))
}

let listManifest = () => {
    const all = Object.keys(store.store)
    return all.reverse()
}

module.exports = {
    setManifest,
    getManifest,
    listManifest
}