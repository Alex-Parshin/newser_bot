'use strict'

//**************Внешние модули для работы системы****************//
import _ from 'underscore'

//************Внутренние модули для работы системы**************//
import { remoteStore, rabbitStore } from './utils/db'

//*****************Основные поисковые движки********************//
import Yandex from '../engines/yandex'
import Google from '../engines/google'
import Rambler from '../engines/rambler'
import store from './state/stateManager'

export default class Router {

    constructor(singleQueryData) {
        this.singleQueryData = singleQueryData
        this.socket = store.getSocket()
    }

    async toEngine() {
        let News_array = []
        try {
            switch (this.singleQueryData.id_engine) {
                case 4:
                    News_array = await new Yandex(this.singleQueryData).index()
                    break
                case 7:
                    News_array = await new Rambler(this.singleQueryData).index()
                    break
                case 3:
                    News_array = await new Google(this.singleQueryData).getRSS()
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
        // await remoteStore(_.flatten(News_array)) // отправка данных на удаленный сервер
        await rabbitStore(_.flatten(News_array), process.env.PUPPETEER_QUEUE) // отправка данных на удаленный сервер через RabbitMQ

        //*****************************************************************************************************//
    }
}