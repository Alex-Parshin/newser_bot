'use strict';

import _ from 'underscore'; // Импорт пакета для работы с массивами и объектами
import scrollPageToBottom from 'puppeteer-autoscroll-down'; // Импорт функции автопрокрутки

import News from '../news'; // Импорт класса для сбора новостных материалов
import { sleep } from '../utils'; // Импорт функции задержки поиска
import { log } from './utils'; // Импорт функции логирования

/**
 * @class WSCN
 * @description Описывает процесс сбора новостей с сайтов, подгрузка новостей осуществляется путем перехода по страницам
 * @param {Object} singleQueryData Данные для обработки конкретного запроса
 * @param {Object} configuration Конфигурация для определенного поискового сервиса
 */
export default class WSCN {

    constructor(singleQueryData, configuration) {
        this.singleQueryData = singleQueryData;
        this.configuration = configuration;
    }

    /**
     * @method index
     * @description Управляет последовательностью действий, необходимых для сбора новостей
     * @param {Function} pageFunc  
     * @returns {Array} News_array
     */
    async index(relNewsFunc) {
        const news = new News(this.singleQueryData, this.configuration); // Инициализация класса News

        let News_array = []; // Объявление переменной для хранения результатов поиска новостей
        let news_set = []; // Объявление переменной для хранения ссылок на дополнительные новости

        if (await news.getMainPage() === true) { // Проверка успешности перехода на главную страницу
            await scrollPageToBottom(this.singleQueryData.page); // Автопрокрутка вниз страницы
            for (let i = 0; i < this.singleQueryData.pages; i++) { // Количество итераций цикла совпадает с количеством страниц, указанных как глубина поиска
                await scrollPageToBottom(this.singleQueryData.page); // Автопрокрутка вниз страницы
                News_array.push(await news.getNews(this.configuration.selectors.news)); // Вызов функции getNews класса News с записью возвращаемого значения в переменную News_array
                if (relNewsFunc != undefined) news_set.push(await relNewsFunc(this.page, this.configuration)); // Если дополнительно была передана функция получения дополнительных новостей - выполняем ее
                await sleep(1000, 'Сбор новостей'); // Пауза
                if (this.singleQueryData.pages > 1 && i != this.singleQueryData.pages - 1) { // Если количество страниц больше 1 и была обработана не последняя страница
                    await this.nextPage(this.selectors); // Вызов функции перехода на следующую страницу
                }
            }
            news_set = _.flatten(news_set); // Приведение исходного массива к одномерному
            if (news_set.length > 0) News_array.push(await this.relatedNews(news_set)); // Если есть ссылки на дополнительные новости - вызов функции их сбора
            await sleep(2000, 'Сбор дополнительных новостей'); // Пауза
        } else {
            return 0;
        }
        return _.flatten(News_array); // Приведение исходного массива к одномерному
    }

    /**
     * @method relatedNews
     * @description Управляет процессом сбора похожих новостей
     * @param {Array} news_set Ссылки на похожие новости
     * @returns {Array} News_array
     */
    async relatedNews(news_set) {
        log(`Начинаю сбор похожих новостей`); // Вывод информации в лог
        const news = new News(this.singleQueryData, this.configuration); // Инициализация класса News

        let News_array = []; // Объявление переменной для хранения результатов поиска новостей

        for (let i = 0; i < news_set.length; i++) { // Количество итераций цикла совпадает с количеством полученных ссылок на похожие новости
            try {
                await scrollPageToBottom(this.singleQueryData.page); // Автопрокрутка вниз страницы
                await this.singleQueryData.page.goto(news_set[i]); // Вызов функции перехода по ссылке

                await solve(this.singleQueryData.page); // Вызов функции проверки и решения капчи
            } catch (e) {
                log('Не могу перейти по URL'); // Вывод информации в лог
                await solve(this.singleQueryData.page); // Вызов функции проверки и решения капчи
            }
            await sleep(2000, 'Сбор похожих новостей'); // Пауза
            News_array.push(await news.getNews(this.configuration.selectors.relatedNewsSel)); // Вызов функции getNews класса News с записью возвращаемого значения в переменную News_array
        }
        news_set = []; // Обнуление массива с ссылками
        return _.flatten(News_array); // Приведение исходного массива к одномерному
    }

    /**
     * @method nextPage
     * @description Переход по страницам
     * @param {Object} selectors CSS-селекторы для поиска элементов страницы 
     * @param {Function} pageFunc Функция для корректного перехода по страницам 
     */
    async nextPage(selectors, pageFunc) {
        const next_page = await this.singleQueryData.page.$(selectors[0]); // Поиск элемента страницы, отвечающего за переход на следующую страницу
        try {
            if (next_page != null) { // Если найдет
                await sleep(2000, 'Переход на следующую страницу'); // Пауза
                const next_page_title = await this.singleQueryData.page.evaluate(el => el.textContent, next_page); // Получение текстового значения элемента
                const next_page_href = await this.singleQueryData.page.evaluate(el => el.getAttribute('href'), next_page); // Получение href атрибута элемента

                if (pageFunc != undefined) await pageFunc(next_page, next_page_title, next_page_href, this.page); // Если дополнительно передана функция постобработки - выполнение
                await this.goPage(next_page_href); // Переход по ссылке
            } else {
                log('Нет других страниц'); // Вывод информации в лог
                await sleep(2000, 'Нет других страниц'); // Пауза
                await solve(this.singleQueryData.page); // Вызов функции проверки и решения капчи
            }
        } catch (e) {
            log(`Error ${e}`); // Вывод информации в лог
        }
    }

    /**
     * @method goPage
     * @description Переход по переданной ссылке
     * @param {String} next_page_href Ссылка на следующую страницу
     */
    async goPage(next_page_href) {
        await this.singleQueryData.page.goto(decodeURI(this.configuration.urls.startUrl + next_page_href)); // Переход по переданной ссылке
        await solve(this.singleQueryData.page); // Вызов функции проверки и решения капчи
    }
}