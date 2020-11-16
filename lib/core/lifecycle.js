'use strict'

import puppeteer from 'puppeteer';

import Router from './router'
import { getRandom, calculateStatistics, secToMinToHoursConvert } from './utils/utils';
import store from './state/stateManager'
import { log } from './utils/utils'

import dotenv from 'dotenv';
dotenv.config();

const options = {
    args: [
        "--no-sandbox",
        "--unhandled-rejections=strict",
        "--disable-notifications"
    ],
    headless: true,
    ignoreHTTPSErrors: true,
    ignoreDefaultArgs: ['--disable-extensions']
};

let isGo = true;
let isServer = false;
let result = [];

const INTERVAL = 3000;

let queryCount = 0;
let AllNews = 0;
let fullTimeWorking = 0;
let goTime = new Date()

class Lifecycle {

    constructor() {
        this.singleQueryData = {}
        this.goTime = ''
    }

    async start(singleQueryData) {
        this.singleQueryData = singleQueryData
        isServer = true
        isGo = true
        store.setStatus(1)
    }

    async mainQueue() {
        const browser = await puppeteer.launch(options)
        log("Браузер запущен", 0)

        setInterval(async() => {
            if (isGo && isServer) {
                log("Начинаю обработку", 1)
                isGo = false
                await store.setConfig()

                let queryData = await store.getQuery(this.singleQueryData.source)
                this.singleQueryData.query = queryData.query
                this.singleQueryData.id_request = queryData.id_request

                for (let i = 0; i < Object.keys(this.singleQueryData.engines).length; i++) {
                    if (Object.values(this.singleQueryData.engines)[i] === true && isServer) {

                        if (Object.keys(this.singleQueryData.engines)[i] === 4 && store.getIsCaptcha()) {
                            log('Пропускаю поиск в Yandex.News из-за случая капчи')
                            continue
                        }

                        let page = await browser.newPage()
                        page.setDefaultNavigationTimeout(15000);
                        page.setViewport({
                            width: 1920,
                            height: 1080
                        })
                        this.singleQueryData.page = page
                        this.singleQueryData.id_engine = Number(Object.keys(this.singleQueryData.engines)[i])
                        await this.run()
                        await page.close()

                        if (store.getStatus() === 2 && !isServer) {
                            log('Бот остановлен!', 0);
                            store.setStatus(0)
                        }

                    }
                }
                isGo = true
            }
        }, INTERVAL)
    }

    async run() {
        let config = store.getConfig().data
        if (config) log('Получил конфигурацию')

        let now = new Date();
        let queryTime = 0;

        log(`Начинаю обработку поискового запроса: ${this.singleQueryData.query} (${this.singleQueryData.pages} страниц(ы))`);
        const userAgent = config.common.userAgents[getRandom(0, config.common.userAgents.length)];
        log(userAgent)

        this.singleQueryData.page.setUserAgent(userAgent)
        this.singleQueryData.config = config

        const router = new Router(this.singleQueryData)
        result = await router.toEngine()

        const resNum = Number(result.length)

        if (!resNum || resNum === 0) {
            log(`Ошибка при обработке запроса`)
            return
        } else {
            await store.setNews(result)

            //*****************************Stats area ****************************************************************//
            let staticstics = calculateStatistics(AllNews, resNum, goTime, now);
            AllNews = staticstics.AllNews;
            fullTimeWorking = staticstics.fullTimeWorking;
            queryTime = staticstics.queryTime;
            queryCount += 1;
            //********************************************************************************************************//

            log(`Обработка запроса заняла ${queryTime} секунд! За запрос получено ${resNum} новостей`)
            log(`Всего обработано ${queryCount} запросов за ${secToMinToHoursConvert(fullTimeWorking)} и получено ${AllNews} новостей`);

            console.table({
                'Время обработки запроса, с': queryTime,
                'Количество новостей за запрос': resNum,
                'Обработанных запросов': queryCount,
                'Общее время работы': secToMinToHoursConvert(fullTimeWorking),
                'Общее количество новостей': AllNews,
                'Количество случаев капчи': store.getCaptchaCounter()
            })
        }
    }

    async stop() {
        log('Останавливаю бота', 2)
        store.setStatus(2)
        isServer = false;
    }

}

export default new Lifecycle()