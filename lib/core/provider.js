'use strict'

import request from 'request'
import path from 'path'

export async function serverProvider(url) {
    console.log("Получаю данные с сервера");
    global.newser.logger.toTextFile("Получаю данные с сервера");
    return await new Promise((resolve, reject) => {
        request.get(url,
            async (error, response, body) => {
                if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                    global.newser.socket.emit('message', {
                        message: `Успешно получен запрос ${this.query}`,
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    })
                    global.newser.logger.toTextFile(`Успешно получен запрос ${this.query}`);
                    resolve({
                        query: JSON.parse(body).query.replace(/"/g, ' ').trim(),
                        id_request: Number(JSON.parse(body).id_request)
                    });
                } else {
                    console.log("Не успешно", error);
                    global.newser.socket.emit('message', {
                        message: `Ошибка при получении запроса`,
                        sender: 'Newser',
                        code: 1,
                        subtitle: 'В работе'
                    })
                    global.newser.logger.toTextFile(`Ошибка при получении запроса!`);
                    reject(`Ошибка при получении запроса!`)
                }
            })
    })
}

export function localFileProvider(fileName) {
    console.log(`Получаю данные из файла ${fileName}`);
    let localData = require(`${path.resolve()}/lib/data/${fileName}.json`)
    let localDataQuery = global.newser.utils.getRandom(0, localData.length)
    return {
        query: localDataQuery.query,
        id_request: Number(localDataQuery.id_request)
    }
}