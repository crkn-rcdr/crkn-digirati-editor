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
    let all = Object.keys(store.store)
    all = all.filter((item) => {
        if(item == "wipPath") return false
        return true
    })
    return all.reverse()
}

module.exports = {
    setManifest,
    getManifest,
    listManifest
}