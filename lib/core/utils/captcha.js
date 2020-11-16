'use strict';

import anticaptcha from "@antiadmin/anticaptchaofficial";
import store from './../state/stateManager';
import { log } from '.';

export async function solve(page) {

    let configuration = store.getConfig().data;

    const cur_page = await page.url();
    if ((cur_page.indexOf('showcaptcha') != -1) == true) {

        log(`Капча! ${new Date()}`);
        store.setCaptchaCounter();
        store.setIsCaptcha(true);

        // let captcha_input = await page.$(configuration.common.captchaSelectors.input);
        // const element = await page.$(configuration.common.captchaSelectors.img);
        // const base64image = await element.screenshot({ encoding: "base64" });
        // log("Посылаю на обработку!");

        // anticaptcha.setAPIKey(process.env.ANTICAPTCHA_ID);
        // anticaptcha.getBalance()
        //     .then(balance => log(`На балансе ${balance} $`))
        //     .catch(error => log(`Получена ошибка ${error}`));

        // await anticaptcha.solveImage(base64image, true)
        //     .then(async text => {
        //         log(`Расшифрованный текст ${text}`);
        //         await captcha_input.type(text);
        //         await page.keyboard.press('Enter');
        //         log(`Капча решена (${text})`);
        //     })
        //     .catch(error => log(`Получена ошибка ${error}`));
    } else {
        log(`Капчи нет!`);
        store.setIsCaptcha(false);
    }
}