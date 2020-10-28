'use strict'

import _ from 'underscore'

import News from '../news'
import { autoscroll } from './../utils/utils'

export default class WSW {

    constructor(page, pages, query, engine, configuration, id_request, socket) {
        this.page = page;
        this.pages = pages;
        this.query = query;
        this.engine = engine;
        this.configuration = configuration;
        this.id_request = id_request;
        this.socket = socket
    }

    async index(pageFunc) {
        const utils = new Utils();
        var news = new News(this.page, this.pages, this.query, this.configuration, this.engine, this.id_request, this.socket);
        var News_array = [];
        if (await news.getMainPage() == true) {
            await autoscroll();
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array, this.configuration);
        }
        return _.flatten(News_array);
    }
}