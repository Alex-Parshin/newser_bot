'use strict'

const clc = require('cli-color');
const _ = require('underscore');

const Captcha = require('../../core/utils/captcha');
const News = require('../news');
const Messages = require('../../core/utils/messages');
const Utils = require('../../core/utils/utils');

class WSCN {

    constructor(page, pages, query, engine, configuration, id_request, socket = {}) {
        this.page = page;
        this.pages = pages;
        this.query = query;
        this.engine = engine;
        this.configuration = configuration;
        this.selectors = [];
        this.id_request = id_request;
        this.socket = socket
    }

    async index(relNewsFunc) {

        var now = new Date();

        const utils = new Utils();
        const news = new News(this.page, this.pages, this.query, this.configuration, this.engine, this.id_request, this.socket);

        var News_array = [];
        var news_set = [];


        if (await news.getMainPage() == true) {
            for (let i = 0; i < this.pages; i++) {

                await utils.autoscroll();
                News_array.push(await news.getNews(this.configuration.selectors.news));
                if (relNewsFunc != undefined) news_set.push(await relNewsFunc(this.page, this.configuration));
                await utils.sleep(1000)
                if (this.pages > 1 && i != this.pages - 1) {
                    await this.nextPage(this.selectors);
                }

            }

            news_set = await _.flatten(news_set);
            if (news_set.length > 0) News_array.push(await this.relatedNews(news_set));
            await utils.sleep(5000)

        } else {
            return 0;
        }

        return _.flatten(News_array);
    }

    async relatedNews(news_set) {

        this.socket.emit('message', {
            message: `Начинаю сбор похожих новостей`,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })

        var now = new Date();

        const utils = new Utils();
        const messages = new Messages();
        const news = new News(this.page, this.pages, this.query, this.configuration, this.engine, this.id_request, this.socket);

        var News_array = [];

        await messages.showRelated();

        for (let i = 0; i < news_set.length; i++) {
            try {
                await utils.autoscroll(this.page);
                await this.page.goto(news_set[i]);

                const captcha = new Captcha(this.page);
                await captcha.solve();
            } catch (e) {
                await messages.cantUrl(now, news_set[i]);
                await captcha.solve();
            }
            await utils.sleep(2000, 'Сбор похожих новостей')
            News_array.push(await news.getNews(this.configuration.selectors.relatedNewsSel));
        }

        news_set = [];
        return _.flatten(News_array);
    }

    async nextPage(selectors, pageFunc) {
        const now = new Date();
        const messages = new Messages();
        const next_page = await this.page.$(selectors[0]);
        const utils = new Utils()

        try {

            if (next_page != null) {
                await utils.sleep(2000)
                const next_page_title = await this.page.evaluate(el => el.textContent, next_page);
                const next_page_href = await this.page.evaluate(el => el.getAttribute('href'), next_page);

                if (pageFunc != undefined) await pageFunc(next_page, next_page_title, next_page_href, this.page);
                await this.goPage(next_page_href);
            } else {
                await messages.noNextPage(now);
                await utils.sleep(2000)
                const captcha = new Captcha(this.page);
                await captcha.solve();
            }

        } catch (e) {
            await messages.showError(now, `${e}`);

            this.socket.emit('message', {
                message: `${e}`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })

            return true;
        }
    }

    async goPage(next_page_href) {
        await this.page.goto(decodeURI(this.configuration.urls.startUrl + next_page_href));
        const captcha = new Captcha(this.page);
        await captcha.solve();
    }
}

module.exports = WSCN;