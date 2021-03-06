'use strict'

import request from 'request'
import fs from 'fs'
import store from './state/stateManager'
import appRoot from 'app-root-path'
import { getRandom } from './utils/utils'
import { log } from './utils/utils'

export async function serverProvider() {
    log("Получаю данные с сервера")

    let url = store.getUrl()
    let engines = store.getEngines()

    return await new Promise((resolve, reject) => {
        request.get(url,
            async(error, response, body) => {
                if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                    let query = JSON.parse(body).query.replace(/"/g, ' ').trim()
                    log(`Успешно получен запрос ${query}`)
                    resolve({
                        query: query,
                        id_request: Number(JSON.parse(body).id_request),
                        engines: engines
                    });
                } else {
                    log(`Ошибка при получении запроса`)
                    reject(`Ошибка при получении запроса!`)
                }
            })
    })
}

export async function localFileProvider() {
    let filePath = `${appRoot}/lib/data`
    let data = JSON.parse(fs.readFileSync(`${filePath}/${process.env.QUEUE_FILE}.json`, 'utf-8'))

    if (data.length === 0) {
        log('Внутренняя очередь пуста. Обрабатываю данные с сервера')
        return null
    }

    let result = {
        query: data[0].query,
        id_request: Number(data[0].id_request),
        engines: data[0].engines
    }

    data = data.filter(query => query.query !== result.query)
    fs.writeFileSync(`${filePath}/${process.env.QUEUE_FILE}.json`, JSON.stringify(data))
    return result
}

export async function addQueryToQueue({ query, id_request, engine }) {
    let filePath = `${appRoot}/lib/data`
    let engines = {}
    let data = JSON.parse(fs.readFileSync(`${filePath}/${process.env.QUEUE_FILE}.json`, 'utf-8'))
    switch (engine) {
        case 'Yandex.News':
            engines = { 4: true }
            break
        case 'Rambler.News':
            engines = { 7: true }
            break
        case 'Google.News':
            engines = { 3: true }
            break
    }

    data.push({
        query: query,
        id_request: id_request > 0 ? id_request : getRandom(0, 1000),
        engines: engines
    })
    fs.writeFileSync(`${filePath}/${process.env.QUEUE_FILE}.json`, JSON.stringify(data))
    return 0
}

export function checkQueueFile() {
    let filePath = `${appRoot}/lib/data`
    try {
        if (!fs.existsSync(`${filePath}/${process.env.QUEUE_FILE}.json`)) {
            fs.open(`${filePath}/queries.json`, 'w', (err) => {
                if (err) throw err;
                fs.writeFileSync(`${filePath}/queries.json`, '[]');
                log('Создан файл запросов!');
            });
        } else {
            log('Файл запросов уже существует!')
        }
    } catch (err) {
        log(err)
    }
}