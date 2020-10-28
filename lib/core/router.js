'use strict'

//**************Внешние модули для работы системы****************//
import _ from 'underscore'

//************Внутренние модули для работы системы**************//
import { remoteStore, rabbitStore } from './utils/db'

//*****************Основные поисковые движки********************//
import Yandex from '../engines/yandex'
import Google from '../engines/google'
import Rambler from '../engines/rambler'

export default class Router {

    constructor(page, query, id_request, pages, configuration, id_engine, socket = {}) {
        this.page = page
        this.query = query
        this.id_request = id_request
        this.pages = pages
        this.configuration = configuration
        this.id_engine = id_engine
        this.socket = socket
    }

    async toEngine() {
        let News_array = []
        try {
            switch (Number(this.id_engine)) {
                case 4: News_array = await new Yandex(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).index()
                    break
                case 7: News_array = await new Rambler(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).index()
                    break
                case 3: News_array = await new Google(this.page, this.pages, this.query, this.configuration, this.id_request, this.id_engine, this.socket).getRSS()
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
        return News_array || []
    }

    async toRabbitMQ(News_array) {
        //****************************** Обработка полученных новостей ****************************************//
        // await remoteStore(_.flatten(News_array), this.id_request, this.id_engine) // отправка данных на удаленный сервер
        // await rabbitStore(_.flatten(News_array), 'puppeteer_bot') // отправка данных на удаленный сервер через RabbitMQ
        //*****************************************************************************************************//
    }
}