'use strict'

//**************Внешние модули для работы системы****************//
const clc = require('cli-color')
const _ = require('underscore')
    //************Внутренние модули для работы системы**************//
const DB = require('./utils/db')
    //*****************Основные поисковые движки********************//
const Yandex = require('../engines/yandex')
const Google = require('../engines/google')
const Rambler = require('../engines/rambler')

/**
 * Маршрутизация запросов к соответствующим обработчикам, работа с полученными данными
 * @param {object} page - объекта класса Page, открытая страница
 * @param {string} query - поисковой запрос
 * @param {string} id_request - ID запроса
 * @param {number} pages - глубина поиска (в страницах)
 * @param {object} configuration - объект конфигурации, полученный из файла data/configuration.json
 * @param {string} id_engine - ID поисковой системы
 */

class Router {

    constructor(page, query, id_request, pages, configuration, id_engine, socket = {}) {
        this.page = page
        this.query = query
        this.id_request = id_request
        this.pages = pages
        this.configuration = configuration
        this.id_engine = id_engine
        this.socket = socket
    }

    /**
     * Определение поисковой системы и вызов метода Index соответствующего класса
     * @returns {Array of Objects} News_array - массив полученных новостей
     */

    async toEngine() {
        let News_array = []
        try {
            switch (Number(this.id_engine)) {
                case 4:
                    News_array = await new Yandex(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).index()
                        // await this.page.close()
                    break
                case 7:
                    News_array = await new Rambler(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).index()
                        // await this.page.close()
                    break
                case 3:
                    News_array = await new Google(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).getRSS()
                        // await this.page.close()
                    break
                default:
                    console.log("Такого движка нет")
                    break
            }
        } catch (e) {
            console.log(e)
            this.socket.emit('message', {
                message: `${e}`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            return 0
        }
        // console.log(News_array)
        return News_array || []
    }

    async toRabbitMQ(News_array) {
        //****************************** Обработка полученных новостей ****************************************//
        const db = new DB() // инициализация объекта класса DB

        // await db.remoteStore(_.flatten(News_array), this.id_request, this.id_engine) // отправка данных на удаленный сервер

        // await db.rabbitStore(_.flatten(News_array), 'puppeteer_bot') // отправка данных на удаленный сервер через RabbitMQ

        //*****************************************************************************************************//
    }
}

module.exports = Router