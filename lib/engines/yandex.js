'use strict'

import WSCN from '../core/struct/wscn'
import { sleep } from './../core/utils/utils'

export default class Yandex extends WSCN {

    constructor(page, pages, query, configuration, id_request, id_engine, socket = {}) {
        super(page, pages, query, id_engine, configuration.engines.yandex, id_request, socket);
        this.selectors = [this.configuration.selectors.nextPage_1_Selector, this.configuration.selectors.nextPage_2_Selector]
    }

    async index() {
        const relNewsFunc = async(page, configuration) => {
            var news_set = [];
            var item_hrefs = await page.$$(configuration.selectors.relatedNews);
            console.log(`Похожих новостей ${item_hrefs.length}`)
            for (let i = 0; i < item_hrefs.length; i++) {
                var item_hrefs_href = await page.evaluate(el => el.getAttribute('href'), item_hrefs[i]);
                await news_set.push(item_hrefs_href);
            }
            return news_set;
        }
        return await super.index(relNewsFunc);
    }

    async nextPage(next_page_title) {
        const utils = new Utils()
        const pageFunc = async(next_page, next_page_title, next_page_href, page) => {
            if (next_page_title != 'Следующая') {
                // const next_page = await page.$(this.selectors[1]);
                const next_page_title = await page.evaluate(el => el.textContent, next_page);
                if (next_page_title == 'Следующая') {
                    const next_page_href = await page.evaluate(el => el.getAttribute('href'), next_page);
                    await sleep(5000)
                    return next_page_href;
                } else {
                    console.log('Ошибка перехода по странице. Не найден селектор');
                    this.socket.emit('message', 'Ошибка перехода по странице. Не найден селектор')
                    return;
                }
            }
        }
        await super.nextPage(this.selectors, pageFunc);
    }
}