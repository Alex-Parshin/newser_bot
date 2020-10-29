import { getRandom } from './../utils/utils'

class Store {
    constructor() {
        if (Store.exists) return Store.instance
        
        this.source = ''
        this.query = ''
        this.socket = {}
        this.id_request = 0
        this.id_engine = 0
        this.page = {}
        this.pages = 0
        this.url = ''
        this.engines = {}
        this.config = {}
        this.isCaptcha = false
        this.captchaCounter = 0
        
        Store.exists = true
        Store.instance = this
    }

    /** Mutations */
    setSource(data) {
        this.source = data
    }
    setQuery(data) {
        this.query = data
    }
    setSocket(data) {
        this.socket = data
    }
    setIdRequest(data) {
        this.id_request = data
    }
    setIdEngine(data) {
        this.id_engine = data
    }
    setPage(data) {
        this.page = data
    }
    setPages(data) {
        this.pages = data
    }
    setUrl(data) {
        this.url = data
    }
    setEngines(data) {
        this.engines = data
    }
    setConfig(data) {
        this.config = data
    }
    setIsCaptcha() {
        this.isCaptcha = !this.isCaptcha 
    }
    setCaptchaCounter() {
        this.captchaCounter += 1
    }

    /** Getters */
    getState() {
        return this
    }
    getSource() {
        return this.source.length > 0 ? this.source : process.env.LOCAL_FILE_SOURCE
    }
    getQuery() {
        return this.query.length > 0 ? this.query : ''
    }
    getSocket() {
        return this.socket
    }
    getIdRequest() {
        return this.id_request === 0 ? getRandom(1, 1000) : this.id_request
    }
    getIdEngine() {
        return this.id_engine
    }
    getPage() {
        return this.page
    }
    getPages() {
        return Number(this.pages) > 0 ? this.pages : process.env.DEFAULT_PAGES
    }
    getUrl() {
        return this.url.length > 0 ? this.url : process.env.QUERY_URL
    }
    getEngines() {
        return Object.keys(this.engines).length > 0 ? this.engines : { google: true }
    }
    getConfig() {
        return this.config
    }
}

export default new Store()