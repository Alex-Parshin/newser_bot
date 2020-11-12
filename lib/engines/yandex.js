'use strict'

import WSCN from '../core/struct/wscn'
import { sleep } from './../core/utils/utils'
import { log } from './../core/utils/utils'

export default class Yandex extends WSCN {

    constructor(singleQueryData) {
        super(singleQueryData, singleQueryData.config.engines.yandex)
        this.configuration = singleQueryData.config.engines.yandex

        this.singleQueryData = singleQueryData

        this.selectors = [this.configuration.selectors.nextPage_1_Selector, this.configuration.selectors.nextPage_2_Selector]
    }

    async index() {
        const relNewsFunc = async() => {
            let news_set = [];
            let item_hrefs = await this.singleQueryData.page.$$(this.configuration.selectors.relatedNews);
            console.log(`Похожих новостей ${item_hrefs.length}`)
            for (let i = 0; i < item_hrefs.length; i++) {
                let item_hrefs_href = await this.singleQueryData.page.evaluate(el => el.getAttribute('href'), item_hrefs[i]);
                news_set.push(item_hrefs_href);
            }
            return news_set;
        }
        return await super.index(relNewsFunc);
    }

    async nextPage() {
        const pageFunc = async(next_page, next_page_title) => {
            if (next_page_title != 'Следующая') {
                const next_page_title = await this.singleQueryData.page.evaluate(el => el.textContent, next_page);
                if (next_page_title == 'Следующая') {
                    const next_page_href = await this.singleQueryData.page.evaluate(el => el.getAttribute('href'), next_page);
                    await sleep(5000)
                    return next_page_href;
                } else {
                    log('Ошибка перехода по странице. Не найден селектор');
                    return;
                }
            }
        }
        await super.nextPage(this.selectors, pageFunc);
    }
}