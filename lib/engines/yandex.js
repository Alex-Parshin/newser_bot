'use strict'

import WSCN from '../core/struct/wscn'
import { sleep } from './../core/utils/utils'
import store from './../core/state/stateManager'

export default class Yandex extends WSCN {

    constructor() {
        super(store.getConfig().engines.yandex)
        this.configuration = store.getConfig().engines.yandex
        this.page = store.getPage()
        this.socket = store.getSocket()

        this.selectors = [this.configuration.selectors.nextPage_1_Selector, this.configuration.selectors.nextPage_2_Selector]
    }

    async index() {
        const relNewsFunc = async() => {
            var news_set = [];
            var item_hrefs = await this.page.$$(this.configuration.selectors.relatedNews);
            console.log(`Похожих новостей ${item_hrefs.length}`)
            for (let i = 0; i < item_hrefs.length; i++) {
                var item_hrefs_href = await this.page.evaluate(el => el.getAttribute('href'), item_hrefs[i]);
                await news_set.push(item_hrefs_href);
            }
            return news_set;
        }
        return await super.index(relNewsFunc);
    }

    async nextPage() {
        const pageFunc = async(next_page, next_page_title) => {
            if (next_page_title != 'Следующая') {
                const next_page_title = await this.page.evaluate(el => el.textContent, next_page);
                if (next_page_title == 'Следующая') {
                    const next_page_href = await this.page.evaluate(el => el.getAttribute('href'), next_page);
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