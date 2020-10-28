'use strict'

import anticaptcha from "@antiadmin/anticaptchaofficial"
import { toTextFile } from './logger'
import configuration from './../../data/configuration.json'

export async function solve() {
    let page = global.newser.search_data.page
    const cur_page = await page.url()
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
        let captcha_input = await page.$(configuration.common.captchaSelectors.input)
        const element = await page.$(configuration.common.captchaSelectors.img)
        const base64image = await element.screenshot({ encoding: "base64" })
        console.log("Посылаю на обработку!")
        toTextFile("Посылаю на обработку!")
        anticaptcha.setAPIKey(process.env.ANTICAPTCHA_ID);
        ac.getBalance()
            .then(balance => console.log('my balance is $' + balance))
            .catch(error => console.log('received error ' + error))
        await anticaptcha.solveImage(base64image, true)
            .then(async text => {
                console.log('captcha text: ' + text)
                await captcha_input.type(c_response)
                await page.keyboard.press('Enter')
                global.newser.socket.emit('message', {
                    message: `Капча решена (${c_response})`,
                    sender: 'Newser',
                    code: 1,
                    subtitle: 'В работе'
                })
                logger.toTextFile(`Капча решена (${c_response})`)
            })
            .catch(error => console.log('test received error ' + error));
    } else {
        console.log(`Капчи нет!`)
        global.newser.isCaptcha = false
    }
}