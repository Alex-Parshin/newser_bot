class Storage {
    constructor(isCaptcha = null) {

        if (Storage.exists && isCaptcha == this.isCaptcha) {
            return Storage.instance
        } else if (Storage.exists && isCaptcha != this.isCaptcha) {
            this.isCaptcha = isCaptcha
            Storage.instance = this
            return Storage.instance
        }

        this.isCaptcha = isCaptcha
        Storage.exists = true
        Storage.instance = this
    }

    getData() {
        return this.isCaptcha
    }
}

module.exports = Storage;