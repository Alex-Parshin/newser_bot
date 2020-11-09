'use strict'

//**************Внешние модули для работы системы****************//
import _ from 'underscore'

//************Внутренние модули для работы системы**************//

//*****************Основные поисковые движки********************//
import Yandex from '../engines/yandex'
import Google from '../engines/google'
import Rambler from '../engines/rambler'

import { log } from './utils/utils'

export default class Router {

    constructor(singleQueryData) {
        this.singleQueryData = singleQueryData
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
                    log("Такого движка нет")
                    break
            }
        } catch (e) {
            log(`Ошибка ${e}`)
            return 0
        }
        return News_array || []
    }
}