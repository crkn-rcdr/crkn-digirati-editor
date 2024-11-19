const Store = require('electron-store')
const store = new Store()
//store.clear()

let setManifest = (data) => {
    console.log(data)
    store.set(data["id"], JSON.stringify(data))
}

let getManifest = (id) => {
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