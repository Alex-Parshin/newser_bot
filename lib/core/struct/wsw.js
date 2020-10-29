'use strict'

import _ from 'underscore'

import News from '../news'
import { autoscroll } from './../utils/utils'
import store from './../state/stateManager'

export default class WSW {

    constructor(singleQueryData, configuration) {
        this.singleQueryData = singleQueryData
        this.configuration = configuration;
    }

    async index(pageFunc) {
        var news = new News(this.singleQueryData, this.configuration);
        var News_array = [];
        if (await news.getMainPage() == true) {
            await autoscroll(this.singleQueryData.page);
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array, this.configuration);
        }
        return _.flatten(News_array);
    }
}