'use strict'

import _ from 'underscore'

import { getRandom, log, sleep } from '../utils'
import axios from 'axios'

class Store {
    constructor() {
        if (Store.exists) return Store.instance

        this.source = ''
        this.query = ''
        this.socket = null
        this.id_request = 0
        this.id_engine = 0
        this.page = {}
        this.pages = 0
        this.url = ''
        this.engines = {}
        this.config = {}
        this.isCaptcha = false
        this.captchaCounter = 0
        this.draw = null
        this.status = 0

        Store.exists = true
        Store.instance = this
    }

    /** Mutations */
    setSource(data) {
        this.source = data
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
    setIsCaptcha(data) {
        this.isCaptcha = data
    }
    setCaptchaCounter() {
        this.captchaCounter++
    }
    setStatus(status) {
        this.status = status
    }

    async setNews(data) {
        let sliced_array = _.chunk(data, 50);

        try {
            sliced_array.forEach(async chunk => {
                await axios.post(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/sendDataToRabbitMQ`, {
                    queue: process.env.PUPPETEER_QUEUE,
                    data: chunk
                })

                await sleep(2000, 'Отправка новостей')
            });
            log('Новости успешно отправлены')
        } catch (err) {
            log(`Ошибка при отправке новостей ${err}`)
        }

        return []
    }
    async setDraw(data) {
        this.draw = data
        console.log(data)
        try {
            await axios.post(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/drawPoint`, data)
        } catch (err) {
            log(`Ошибка при отправке графика ${err}`)
        }
    }

    /** Getters */
    getState() {
        return this
    }
    getSource() {
        return this.source.length > 0 ? this.source : process.env.LOCAL_FILE_SOURCE
    }
    async getQuery(source) {
        let query
        try {
            query = await axios.get(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/getQuery/${source}`)
            return query.data
        } catch (err) {
            log(`Ошибка при получении запроса ${err}`)
            return 0
        }
    }
    async getConfig() {
        this.config = await axios.get(`http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/getConfig`)
        return this.config.data
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
    getStatus() {
        return this.status
    }
    getIsCaptcha() {
        return this.isCaptcha
    }
}

export default new Store()