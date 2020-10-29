'use strict'

//**************Внешние модули для работы системы****************//
import _ from 'underscore'

//************Внутренние модули для работы системы**************//
import { solve } from '../core/utils/captcha'
import dateFormer from '../core/utils/date'
import { toTextFile } from './utils/logger'
import { sleep } from './utils/utils'
import store from './state/stateManager'

/**
 * Главный модуль работы с новостными материалами - сбор новостей
 * @param {object} page - объекта класса Page, открытая страница
 * @param {number} pages - глубина поиска (в страницах)
 * @param {string} query - поисковой запрос
 * @param {object} configuration - объект конфигурации, полученный из файла data/configuration.json
 * @param {string} id_engine - ID поисковой системы
 * @param {string} id_request - ID запроса
 */

export default class News {

    constructor(configuration) {
        this.configuration = configuration;

        this.page = store.getPage()
        this.socket = store.getSocket()
        this.query = store.getQuery()
        this.id_engine = store.getIdEngine()
        this.id_request = store.getIdRequest()
    }

    async getMainPage() {
        await this.page.goto(this.configuration.urls.startUrl);
        console.log(`На странице ${this.configuration.urls.startUrl}`);
        this.socket.emit('message', {
            message: `На главной странице`,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })
        toTextFile(`На главной странице`)
        await solve()
        await sleep(3000, 'Ввод поискового запроса')
        const input = await this.page.$(this.configuration.selectors.queryField);
        await input.type(this.query);
        await this.page.keyboard.press('Enter')
        await this.page.waitForNavigation()
        await solve()
        await this.page.waitForSelector(this.configuration.selectors.news.title);
        console.log("Страница загружена!")
        return true;
    }

    async getNews(selectors) {
        let News_array = [];
        this.selectors = selectors;
        this.socket.emit('message', {
            message: `Начинаю сбор новостей...`,
            sender: 'Newser',
            code: 1,
            subtitle: 'В работе'
        })
        toTextFile(`Начинаю сбор новостей...`)

        await this.page.waitForSelector(this.selectors.title);

        let news_title = await this.page.$$(this.selectors.title);
        let news_href = await this.page.$$(this.selectors.href);
        let news_agency = await this.page.$$(this.selectors.agency);
        let news_date = await this.page.$$(this.selectors.date);
        let news_desc = await this.page.$$(this.selectors.desc);

        for (let i = 0; i < news_title.length; i++) {
            try {
                let News = new Object({
                    title: "",
                    desc: "",
                    agency: "",
                    href: "",
                    date: "",
                    content: "",
                    lead_img: "",
                    sentimental: '',
                    id_request: this.id_request,
                    id_engine: this.id_engine
                });

                News.title = (await this.page.evaluate(el => el.textContent, news_title[i]));
                News.href = (await this.page.evaluate(el => el.getAttribute('href'), news_href[i])).split('?')[0];
                News.agency = (await this.page.evaluate(el => el.textContent, news_agency[i]));

                News.date = (await this.page.evaluate(el => el.getAttribute('datetime'), news_date[i]));

                if (News.date === null) {
                    News.date = await this.page.evaluate(el => el.textContent, news_date[i]);
                    News.date = await dateFormer(this.id_engine, News.date);
                    News.date = News.date.join(' ');
                }

                News.desc = await this.page.evaluate(el => el.textContent, news_desc[i]);
                News_array.push(News);

            } catch (e) {
                console.log(`ERROR ${e}`)
                this.socket.emit('message', {
                    message: `${e}`,
                    sender: 'Newser',
                    code: 1,
                    subtitle: 'В работе'
                })
                toTextFile(e)
            }
        }
        return _.flatten(News_array);
    }
}