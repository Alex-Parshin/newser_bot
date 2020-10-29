'use strict'

import request from 'request'
import { toTextFile } from '../core/utils/logger'
import { getRandom } from './utils/utils'
import localData from './../data/queries.json'
import store from './state/stateManager'

export async function serverProvider() {
    console.log("Получаю данные с сервера");
    toTextFile("Получаю данные с сервера");

    let socket = store.getSocket()
    let url = store.getUrl()

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
                        id_request: Number(JSON.parse(body).id_request)
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

export function localFileProvider() {
    let localDataQuery = localData[getRandom(0, localData.length)]
    return {
        query: localDataQuery.query,
        id_request: Number(localDataQuery.id_request)
    }
}