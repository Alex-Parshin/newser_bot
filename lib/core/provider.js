'use strict'

import request from 'request'
import fs from 'fs'
import { toTextFile } from '../core/utils/logger'
import store from './state/stateManager'
import appRoot from 'app-root-path'
import { getRandom } from './utils/utils'
import fileData from './../data/queries.json'

export async function serverProvider() {
    console.log("Получаю данные с сервера");
    toTextFile("Получаю данные с сервера");

    let socket = store.getSocket()
    let url = store.getUrl()
    let engines = store.getEngines()

    return await new Promise((resolve, reject) => {
        request.get(url,
            async (error, response, body) => {
                if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                    let query = JSON.parse(body).query.replace(/"/g, ' ').trim()
                    socket.emit('message', {
                        message: `Успешно получен запрос ${query}`,
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    })
                    toTextFile(`Успешно получен запрос ${query}`);
                    resolve({
                        query: query,
                        id_request: Number(JSON.parse(body).id_request),
                        engines: engines
                    });
                } else {
                    console.log("Не успешно", error);
                    socket.emit('message', {
                        message: `Ошибка при получении запроса`,
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    })
                    toTextFile(`Ошибка при получении запроса!`);
                    reject(`Ошибка при получении запроса!`)
                }
            })
    })
}

export async function localFileProvider() {
    let filePath = `${appRoot}/lib/data`
    let data = JSON.parse(fs.readFileSync(`${filePath}/queries.json`, 'utf-8'))

    if (data.length === 0) {
        console.log('Внутренняя очередь пуста. Обрабатываю данные с сервера')
        return null
    }

    let result = {
        query: data[0].query,
        id_request: Number(data[0].id_request),
        engines: data[0].engines
    }

    data = data.filter(query => query.query !== result.query)
    fs.writeFileSync(`${filePath}/queries.json`, JSON.stringify(data))
    return result
}

export async function addQueryToQueue({ query, id_request, engine }) {
    let filePath = `${appRoot}/lib/data`
    let engines = {}

    switch (engine) {
        case 'Yandex.News':
            engines = {4: true }
            break
        case 'Rambler.News':
            engines = {7: true }
            break
        case 'Google.News':
            engines = { 3: true }
            break
    }
    
    fileData.push({
        query: query,
        id_request: id_request > 0 ? id_request : getRandom(0, 1000),
        engines: engines
    })
    fs.writeFileSync(`${filePath}/queries.json`, JSON.stringify(fileData))
    return 0
}