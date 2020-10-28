'use strict'

import anticaptcha from './anticaptcha'
anticaptcha('97203e301632af0a78ff1ba36390b902')

import { toTextFile } from './logger'
import configuration from './../../data/configuration.json'

export async function solve() {

    const cur_page = this.page.url()

    if ((cur_page.indexOf('showcaptcha') != -1) == true) {

        global.newser.isCaptcha = true
        global.newser.captchaCounter += 1

        console.log(`Капча! ${new Date()}`)

        global.newser.socket.emit('message', {
            message: `Капча!`,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })

        toTextFile('Капча!')
        const element = await this.page.$(configuration.common.captchaSelectors.img)
        const base64image = await element.screenshot({ encoding: "base64" })

        global.newser.socket.emit('message', {
            message: base64image,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })

        console.log("Посылаю на обработку!")
        toTextFile("Посылаю на обработку!")

        try {

            let solve = await new Promise(async (resolve, reject) => {

                await anticaptcha.createImageToTextTask({
                    case: true,
                    body: base64image
                },

                    async (err, taskId) => {

                        if (err) {

                            global.newser.socket.emit('message', {
                                message: `Ошибка распознавания капчи! ${err}`,
                                sender: 'Newser',
                                code: 1,
                                subtitle: 'В работе'
                            })

                            toTextFile(`Ошибка распознавания капчи! ${err}`)
                            reject(err)

                        } else {

                            await console.log('Получил идентификатор', taskId)

                            global.newser.socket.emit('message', {
                                message: `Получил идентификатор ${taskId}`,
                                sender: 'Newser',
                                code: 1,
                                subtitle: 'В работе'
                            })

                            toTextFile(`Получил идентификатор ${taskId}`)
                            await anticaptcha.getTaskSolution(taskId, async (err, taskSolution) => {

                                if (err) reject(err)

                                const c_response = await taskSolution
                                console.log(c_response)

                                var captcha_input = await this.page.$(configuration.common.captchaSelectors.input)
                                await captcha_input.type(c_response)

                                await this.page.keyboard.press('Enter')

                                global.newser.socket.emit('message', {
                                    message: `Капча решена (${c_response})`,
                                    sender: 'Newser',
                                    code: 1,
                                    subtitle: 'В работе'
                                })

                                logger.toTextFile(`Капча решена (${c_response})`)
                                resolve("Капча решена")

                            });
                        }
                    });
            });

            let result = await solve
            console.log(result)

        } catch (err) {
            console.log(err)
        }

    } else {
        console.log(`Капчи нет!`)
        global.newser.isCaptcha = false
    }
}