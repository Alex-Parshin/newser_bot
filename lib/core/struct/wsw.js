'use strict'

import _ from 'underscore'

import News from '../news'
import scrollPageToBottom from 'puppeteer-autoscroll-down'
export default class WSW {

    constructor(singleQueryData, configuration) {
        this.singleQueryData = singleQueryData
        this.configuration = configuration;
    }

    async index(pageFunc) {
        const news = new News(this.singleQueryData, this.configuration);
        let News_array = [];
        if (await news.getMainPage() == true) {
            await scrollPageToBottom(this.singleQueryData.page, 200, 100)
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array, this.configuration);
        }
        return _.flatten(News_array);
    }
}