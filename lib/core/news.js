'use strict'

//**************Внешние модули для работы системы****************//
const _ = require('underscore');

//************Внутренние модули для работы системы**************//
const Captcha = require('../core/utils/captcha');
const DateFormer = require('../core/utils/date');
const Messages = require('../core/utils/messages');
const Logger = require('./logger');
const Utils = require('./utils/utils');

/**
 * Главный модуль работы с новостными материалами - сбор новостей
 * @param {object} page - объекта класса Page, открытая страница
 * @param {number} pages - глубина поиска (в страницах)
 * @param {string} query - поисковой запрос
 * @param {object} configuration - объект конфигурации, полученный из файла data/configuration.json
 * @param {string} id_engine - ID поисковой системы
 * @param {string} id_request - ID запроса
 */

class News {

    constructor(page, pages, query, configuration, id_engine, id_request, socket = {}) {
        this.page = page;
        this.pages = pages;
        this.query = query;
        this.configuration = configuration;
        this.id_engine = id_engine;
        this.id_request = id_request;
        this.socket = socket
    }

    /**
     * Переход на главную страницу агрегатора новостей
     * @returns {boolean} true - разрешение дальнейшей обработки запроса
     */

    async getMainPage() {
        let now = new Date();
        const utils = new Utils();
        const messages = new Messages();
        const captcha = new Captcha(this.page, this.socket);
        const logger = new Logger();
        try {
            await this.page.goto(this.configuration.urls.startUrl);
            await messages.onPage(this.configuration.urls.startUrl);
            this.socket.emit('message', {
                message: `На главной странице`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            logger.toTextFile(`На главной странице`)
            await captcha.solve()
        } catch (e) {
            this.socket.emit('message', {
                message: `${e}`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            logger.toTextFile(`${e}`)
            await messages.showError(now, `${e}`);
            return false;
        }
        await utils.sleep(3000, 'Ввод поискового запроса')
        try {
            const input = await this.page.$(this.configuration.selectors.queryField);
            await input.type(this.query);

            await this.page.keyboard.press('Enter')
            await this.page.waitForNavigation()

            await captcha.solve()

            try {
                await this.page.waitForSelector(this.configuration.selectors.news.title);
                await messages.loadComplete(now);
            } catch (e) {
                await messages.showError(now, `${e}`);
                this.socket.emit('message', {
                    message: `${e}`,
                    sender: 'Newser',
                    code: 1,
                    subtitle: 'В работе'
                })
                logger.toTextFile(`${e}`)
                await captcha.solve()
                await this.page.waitForNavigation();
            }

        } catch (e) {
            this.socket.emit('message', {
                message: `${e}`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            logger.toTextFile(`${e}`)
            console.log(`ERROR ${e}`)
            return false
        }
        return true;
    }

    /**
     * Сбор новостей на странице
     * @param {object} selectors - CSS-селекторы для сбора соответствующих полей новостного материала
     * @returns {array} News_array - массив новостных материалов
     */

    async getNews(selectors) {
        const logger = new Logger()
        const dateFormer = new DateFormer();
        let News_array = [];
        this.selectors = selectors;
        try {
            this.socket.emit('message', {
                message: `Начинаю сбор новостей...`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            logger.toTextFile(`Начинаю сбор новостей...`)

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
                        News.date = await dateFormer.index(this.id_engine, News.date);
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
                    logger.toTextFile(e)
                }
            }
        } catch (e) {
            console.log(`${e}`)
            this.socket.emit('message', {
                message: `${e}`,
                sender: 'Newser',
                code: 1,
                subtitle: 'В работе'
            })
            logger.toTextFile(e)
        }
        return _.flatten(News_array);
    }
}

module.exports = News;