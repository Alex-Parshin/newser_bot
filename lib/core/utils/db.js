'use strict'

const clc = require('cli-color');
const request = require('request');
const amqp = require('amqplib/callback_api')
const Logger = require('./../logger')

class DB {

    /**
     * @param {Array of Objects} News_all - собранный новостной материал
     * @param {Number} id_request - идентификатор запроса
     * @param {Number} id_engine - идентификатор поискового движка
     * @return null
     */

    async remoteStore(News_all, id_request, id_engine) {
        this.id_request = id_request;
        this.News_all = News_all;
        this.id_engine = id_engine;
        let resPostAll = []
        for (let i = 0; i < this.News_all.length; i++) {
            try {
                resPostAll.push([this.News_all[i].title, this.News_all[i].href, this.News_all[i].desc, this.News_all[i].date, this.News_all[i].agency]);
            } catch (e) {

            }
        }
        await request.post({
            headers: {
                'content-type': 'application/json',
            },
            url: process.env.SEND_URL,
            json: true,
            form: {
                'id_request': this.id_request,
                'data': JSON.stringify(resPostAll),
                'id_engine': this.id_engine
            },
        }, async(error, response, body) => {
            if (error) {
                throw error;
            }
            console.log(body);
        });
        resPostAll.length = 0;
    }

    async rabbitStore(data, rpc_queue) {
        const logger = new Logger();
        try {
            await new Promise(async(resolve, reject) => {
                await amqp.connect(`amqp://admin:admin@10.19.19.4:5672`, function(error0, connection) {
                    if (error0) {
                        reject(error0)
                        return
                    }
                    console.log(clc.green("[X] Подключился к RabbitMQ"))
                    connection.createChannel(function(error1, channel) {
                        if (error1) {
                            reject(error1)
                            return
                        }
                        channel.assertQueue(rpc_queue, {
                            durable: true
                        });
                        channel.prefetch(1);
                        console.log(clc.green("[X] Создал канал"))
                        channel.sendToQueue(rpc_queue,
                            Buffer.from(JSON.stringify(data)), {
                                headers: {
                                    time: new Date(Date.now()).toLocaleString()
                                }
                            });
                        console.log(clc.green("[X] Отправил данные"))
                        resolve();

                    });
                })
            })
        } catch (err) {
            console.log(err)
            return
        }
    }
}

module.exports = DB;