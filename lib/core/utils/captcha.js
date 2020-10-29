'use strict'

import anticaptcha from "@antiadmin/anticaptchaofficial"
import { toTextFile } from './logger'
import store from './../state/stateManager'

export async function solve(page) {
    
    let configuration = store.getConfig()
    let socket = store.getSocket()

    const cur_page = await page.url()
    if ((cur_page.indexOf('showcaptcha') != -1) == true) {
        console.log(`Капча! ${new Date()}`)
        store.setCaptchaCounter()
        store.setIsCaptcha(true)
        socket.emit('message', {
            message: `Капча!`,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })
        toTextFile('Капча!')
        let captcha_input = await page.$(configuration.common.captchaSelectors.input)
        const element = await page.$(configuration.common.captchaSelectors.img)
        const base64image = await element.screenshot({ encoding: "base64" })
        console.log("Посылаю на обработку!")
        toTextFile("Посылаю на обработку!")
        anticaptcha.setAPIKey(process.env.ANTICAPTCHA_ID);
        anticaptcha.getBalance()
            .then(balance => console.log('my balance is $' + balance))
            .catch(error => console.log('received error ' + error))
        await anticaptcha.solveImage(base64image, true)
            .then(async text => {
                console.log('captcha text: ' + text)
                await captcha_input.type(text)
                await page.keyboard.press('Enter')
                socket.emit('message', {
                    message: `Капча решена (${text})`,
                    sender: 'Newser',
                    code: 1,
                    subtitle: 'В работе'
                })
                logger.toTextFile(`Капча решена (${text})`)
            })
            .catch(error => console.log('test received error ' + error));
    } else {
        console.log(`Капчи нет!`)
        store.setIsCaptcha(false)
    }
}