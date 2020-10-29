'use strict'

import _ from 'underscore'

import { solve } from '../../core/utils/captcha'
import News from '../news'
import { autoscroll, sleep } from './../utils/utils'
import store from './../state/stateManager'

export default class WSCN {

    constructor(page, configuration) {
        this.configuration = configuration;
        
        this.pages = store.getPages()
        this.page = page
        this.socket = store.getSocket()
    }

    async index(relNewsFunc) {
        const news = new News(this.page, this.configuration);
        let News_array = [];
        let news_set = [];
        if (await news.getMainPage() == true) {
            for (let i = 0; i < this.pages; i++) {
                await autoscroll();
                News_array.push(await news.getNews(this.configuration.selectors.news));
                if (relNewsFunc != undefined) news_set.push(await relNewsFunc(this.page, this.configuration));
                await sleep(1000)
                if (this.pages > 1 && i != this.pages - 1) {
                    await this.nextPage(this.selectors);
                }
            }
            news_set = _.flatten(news_set);
            if (news_set.length > 0) News_array.push(await this.relatedNews(news_set));
            await sleep(5000)
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
        const news = new News(this.page, this.configuration);
        var News_array = [];
        for (let i = 0; i < news_set.length; i++) {
            try {
                await autoscroll(this.page);
                await this.page.goto(news_set[i]);

                await solve(this.page);
            } catch (e) {
                console.log('Не могу перейти по URL')
                await solve(this.page);
            }
            await sleep(2000, 'Сбор похожих новостей')
            News_array.push(await news.getNews(this.configuration.selectors.relatedNewsSel));
        }
        news_set = [];
        return _.flatten(News_array);
    }

    async nextPage(selectors, pageFunc) {
        const now = new Date();
        const next_page = await this.page.$(selectors[0]);
        try {
            if (next_page != null) {
                await sleep(2000)
                const next_page_title = await this.page.evaluate(el => el.textContent, next_page);
                const next_page_href = await this.page.evaluate(el => el.getAttribute('href'), next_page);

                if (pageFunc != undefined) await pageFunc(next_page, next_page_title, next_page_href, this.page);
                await this.goPage(next_page_href);
            } else {
                console.log('Нет других страниц')
                await sleep(2000)
                await solve(this.page);
            }
        } catch (e) {
            console.log(`Error ${e}`)
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
        await solve(this.page);
    }
}