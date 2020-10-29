'use strict'

import _ from 'underscore'

import News from '../news'
import { autoscroll, sleep } from '../../core/utils/utils'
import store from './../state/stateManager'

export default class WSC {

    constructor(configuration) {
        this.configuration = configuration;
        this.page = store.getPage()
    }

    async index(pageFunc) {
        const news = new News(this.configuration);

        var News_array = [];

        if (await news.getMainPage() == true) {
            await autoscroll();
            for (let i = 0; i < this.pages; i++) {
                await autoscroll();
                const loadMore = await this.page.$(this.configuration.selectors.loadMore);
                if (loadMore != null) {
                    await sleep(3000)
                    await this.page.click(this.configuration.selectors.loadMore);
                }
            }
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array);
        }
        return _.flatten(News_array);
    }
}