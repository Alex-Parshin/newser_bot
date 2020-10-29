'use strict'

import _ from 'underscore'

import News from '../news'
import { autoscroll } from './../utils/utils'
import store from './../state/stateManager'

export default class WSW {

    constructor(page, configuration) {
        this.page = page
        this.configuration = configuration;
    }

    async index(pageFunc) {
        var news = new News(this.page, this.configuration);
        var News_array = [];
        if (await news.getMainPage() == true) {
            await autoscroll();
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array, this.configuration);
        }
        return _.flatten(News_array);
    }
}