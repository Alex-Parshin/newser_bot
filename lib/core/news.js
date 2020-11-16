'use strict' // Активация "строгого" режима

import _ from 'underscore'; // Импорт пакета для работы с массивами и объектами

import { solve } from '../core/utils/captcha'; // Импорт функции проверки наличия и расшифровки капчи
import dateFormer from '../core/utils/date'; // Импорт функции приведения даты и времени публикации новости к стандартному формату
import { sleep } from './utils'; // Импорт функции задержки поиска
import { log } from './utils'; // Импорт функции логирования

/**
 * @class News
 * @description Главный модуль работы с новостными материалами - сбор новостей
 * @param singleQueryData Данные для обработки конкретного запроса
 * @param configuration Конфигурация для обработки конкретного запроса
 */
export default class News {

    constructor(singleQueryData, configuration) {
        this.configuration = configuration;
        this.singleQueryData = singleQueryData;
        this.page = this.singleQueryData.page;
        this.query = this.singleQueryData.query;
    }

    /**
     * @method getMainPage
     * @description Переходит на главную страницу поискового сервиса
     * @returns true | false
     */
    async getMainPage() {
        try {
            await this.page.goto(this.configuration.urls.startUrl); // Переход по заданному URL
            log(`На странице ${this.configuration.urls.startUrl}`); // Вывод информации в лог

            await solve(this.page); // Вызов функции проверки и решения капчи
            await sleep(3000, 'Ввод поискового запроса'); // Задержка поиска на время с указанием текущей стадии поиска

            const queryField = this.configuration.selectors.queryField // Запись в переменную селектора для поиска строки ввода
            await this.page.click(queryField); // Нажатие мышью на строку ввода
            await sleep(500, 'Нажатие на строку ввода'); // Задержка поиска на время с указанием текущей стадии поиска

            const input = await this.page.$(queryField); // Запись в переменную объекта строки поиска
            await input.type(this.query); // Ввод запроса в строку поиска
            await sleep(500, 'Введен запрос'); // Задержка поиска на время с указанием текущей стадии поиска

            await this.page.keyboard.press('Enter'); // Нажатие кнопки Enter для выполнения запроса (попробовать клик по кнопке Найти)
            await this.page.waitForNavigation(); // Ожидание перехода по ссылке
            await solve(this.page); // Вызов функции проверки и решения капчи

            await this.page.waitForSelector(this.configuration.selectors.news.title); // Ожидание загрузки новостей
            log("Страница загружена!"); // Вывод информации в лог
        } catch (err) {
            log(`Ошибка ${err}`); // Вывод информации в лог
            return false;
        }
        return true;
    }

    /**
     * @method getNews
     * @description Функция формирования массива объектов новостей с определенными полями
     * @param {Object} selectors CSS-селекторы для определнной поисковой системы
     * @returns {Array<Object>} News_array
     */
    async getNews(selectors) {
        let News_array = [];
        this.selectors = selectors;
        log(`Начинаю сбор новостей...`); // Вывод информации в лог

        try {
            await this.page.waitForSelector(this.selectors.title);
        } catch (err) {
            log(`Не могу найти новости ${err}`); // Вывод информации в лог
            return;
        }

        let news_title = await this.page.$$(this.selectors.title); // Получение элементов страницы с заголовком новости
        let news_href = await this.page.$$(this.selectors.href); // Получение элементов страницы с ссылкой на новость
        let news_agency = await this.page.$$(this.selectors.agency); // Получение элементов страницы с агентством новости
        let news_date = await this.page.$$(this.selectors.date); // Получение элементов страницы с датой и временем публикации новости
        let news_desc = await this.page.$$(this.selectors.desc); // Получение элементов страницы с описанием новости

        for (let i = 0; i < news_title.length; i++) {
            try {
                let News = new Object({ // Инициализация нового объекта новости
                    title: "",
                    desc: "",
                    agency: "",
                    href: "",
                    date: "",
                    content: "",
                    lead_img: "",
                    sentimental: '',
                    id_request: this.singleQueryData.id_request,
                    id_engine: this.singleQueryData.id_engine
                });

                News.title = (await this.page.evaluate(el => el.textContent, news_title[i])); // Получение заголовка новости
                News.href = (await this.page.evaluate(el => el.getAttribute('href'), news_href[i])).split('?')[0]; // Получение ссылки на новость
                News.agency = (await this.page.evaluate(el => el.textContent, news_agency[i])); // Получение новостного агентства

                News.date = (await this.page.evaluate(el => el.getAttribute('datetime'), news_date[i])); // Получение даты и времени публикации новости

                if (News.date === null) { // Проверка если дата и время публикации не указаны в datetime
                    News.date = await this.page.evaluate(el => el.textContent, news_date[i]); // Получение даты и времени публикации новости в текстовом формате
                    News.date = dateFormer(this.singleQueryData.id_engine, News.date); // Обработка даты и времени публикации новости в зависимости от поисковой системы
                    // и приведение ее к стандартному виду (дд-мм-гггг чч:мм:сс)
                }

                News.desc = await this.page.evaluate(el => el.textContent, news_desc[i]); // Получение описания новости
                News_array.push(News); // Добавление объекта новости в конец массива

            } catch (e) {
                log(`ERROR ${e}`); // Вывод информации в лог
            }
        }
        return _.flatten(News_array);
    }
}