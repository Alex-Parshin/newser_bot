'use strict'

import _ from 'underscore'

import News from '../news'
import { sleep } from '../../core/utils/utils'
import scrollPageToBottom from 'puppeteer-autoscroll-down'
export default class WSC {

    constructor(singleQueryData, configuration) {
        this.configuration = configuration;
        this.singleQueryData = singleQueryData
    }

    async index(pageFunc) {
        const news = new News(this.singleQueryData, this.configuration);

        let News_array = [];

        if (await news.getMainPage() == true) {
            await scrollPageToBottom(this.singleQueryData.page)
            for (let i = 0; i < this.singleQueryData.pages; i++) {
                await scrollPageToBottom(this.singleQueryData.page)
                const loadMore = await this.singleQueryData.page.$(this.configuration.selectors.loadMore);
                if (loadMore != null) {
                    await sleep(3000)
                    await this.singleQueryData.page.click(this.configuration.selectors.loadMore);
                }
            }
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array);
        }
        return _.flatten(News_array);
    }
}