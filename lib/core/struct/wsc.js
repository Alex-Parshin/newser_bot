'use strict'
const clc = require('cli-color');
const _ = require('underscore');

const News = require('../news');
const Messages = require('../../core/utils/messages');
const Utils = require('../../core/utils/utils');

class WSC {

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
        const news = await new News(this.page, this.pages, this.query, this.configuration, this.engine, this.id_request, this.socket);

        var News_array = [];

        if (await news.getMainPage() == true) {
            await utils.autoscroll();
            for (let i = 0; i < this.pages; i++) {
                await utils.autoscroll();
                const loadMore = await this.page.$(this.configuration.selectors.loadMore);
                if (loadMore != null) {
                    await utils.sleep(3000)
                    await this.page.click(this.configuration.selectors.loadMore);
                }
            }
            News_array = await news.getNews(this.configuration.selectors.news);
            if (pageFunc != undefined) News_array = await pageFunc(News_array);
        }
        return _.flatten(News_array);
    }
}

module.exports = WSC;