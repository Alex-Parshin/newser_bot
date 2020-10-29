'use strict'

import request from 'request'
import amqp from 'amqplib/callback_api'

export async function remoteStore(News_all, id_request, id_engine) {
    let resPostAll = []
    for (let i = 0; i < News_all.length; i++) {
        resPostAll.push([News_all[i].title, News_all[i].href, News_all[i].desc, News_all[i].date, News_all[i].agency]);
    }

    await request.post({
        headers: {
            'content-type': 'application/json',
        },
        url: process.env.SEND_URL,
        json: true,
        form: {
            'id_request': id_request,
            'data': JSON.stringify(resPostAll),
            'id_engine': id_engine
        },
    }, async (error, response, body) => {
        if (error) {
            throw error;
        }
        console.log(body);
    });
    resPostAll.length = 0;
}

export async function rabbitStore(data, rpc_queue) {
    try {
        await new Promise(async (resolve, reject) => {
            await amqp.connect(`amqp://${process.env.RABBIT_USER}:${process.env.RABBIT_PASSWORD}@${process.env.RABBIT_HOST}:${process.env.RABBIT_PORT}`, 
            function (error0, connection) {
                if (error0) {
                    reject(error0)
                    return
                }
                console.log("[X] Подключился к RabbitMQ")
                connection.createChannel(function (error1, channel) {
                    if (error1) {
                        reject(error1)
                        return
                    }
                    channel.assertQueue(rpc_queue, {
                        durable: true
                    });
                    channel.prefetch(1);
                    console.log("[X] Создал канал")
                    channel.sendToQueue(rpc_queue,
                        Buffer.from(JSON.stringify(data)), {
                        headers: {
                            time: new Date(Date.now()).toLocaleString()
                        }
                    });
                    console.log("[X] Отправил данные")
                    resolve();
                });
            })
        })
    } catch (err) {
        console.log(err)
        return
    }
}