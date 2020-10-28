'use strict'

const request = require('request')
const path = require('path')
const Utils = require('./utils/utils')

class Provider {

    constructor() {
        this.utils = new Utils()
        this.query = ''
        this.id_request = 0
    }

    async serverProvider(url) {
        console.log("Получаю данные с сервера");
        global.newser.logger.toTextFile("Получаю данные с сервера");
        return await new Promise((resolve, reject) => {
            request.get(url,
                async(error, response, body) => {
                    if (!error && response.statusCode == 200 && JSON.parse(body).query != " ") {
                        this.query = JSON.parse(body).query.replace(/"/g, ' ').trim();
                        this.id_request = Number(JSON.parse(body).id_request);
                        global.newser.socket.emit('message', {
                            message: `Успешно получен запрос ${this.query}`,
                            sender: 'Newser',
                            code: 1,
                            subtitle: 'В работе'
                        })
                        global.newser.logger.toTextFile(`Успешно получен запрос ${this.query}`);
                        resolve({
                            query: this.query,
                            id_request: this.id_request
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

    localFileProvider(fileName) {
        console.log(`Получаю данные из файла ${fileName}`);
        let localData = require(`${path.resolve()}/lib/data/${fileName}.json`)
        let localDataQuery = this.utils.getRandom(0, localData.length)
        this.query = localDataQuery.query
        this.id_request = Number(localDataQuery.id_request)
        return {
            query: this.query,
            id_request: this.id_request
        }
    }
}

module.exports = new Provider()