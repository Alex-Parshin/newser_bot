'use strict' // Активация "строгого" режима

import _ from 'underscore'; // Импорт пакета для работы с массивами и объектами

import News from '../news'; // Импорт класса для сбора новостных материалов
import { sleep } from '../utils'; // Импорт функции задержки поиска
import scrollPageToBottom from 'puppeteer-autoscroll-down'; // Импорт функции автопрокрутки

/**
 * @class WSC
 * @description Описывает процесс сбора новостей с сайтов, подгрузка новостей осуществляется путем нажатия на кнопку "Показать еще"
 * @param {Object} singleQueryData Данные для обработки конкретного запроса
 * @param {Object} configuration Конфигурация для определенного поискового сервиса
 */
export default class WSC {

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
    async index(pageFunc) {
        const news = new News(this.singleQueryData, this.configuration); // Инициализация класса News

        let News_array = []; // Объявление переменной для хранения результатов поиска новостей

        if (await news.getMainPage() == true) { // Проверка успешности перехода на главную страницу
            await scrollPageToBottom(this.singleQueryData.page); // Автопрокрутка вниз страницы
            for (let i = 0; i < this.singleQueryData.pages; i++) { // Количество итераций цикла совпадает с количеством страниц, указанных как глубина поиска
                await scrollPageToBottom(this.singleQueryData.page); // Автопрокрутка вниз страницы
                const loadMore = await this.singleQueryData.page.$(this.configuration.selectors.loadMore); // Поиск кнопки "Показать еще"
                if (loadMore != null) { // Проверка нахождения кнопки
                    await sleep(3000, 'Загрузка новостей'); // Пауза
                    await this.singleQueryData.page.click(this.configuration.selectors.loadMore); // Клик по кнопке "Показать еще"
                }
            }
            News_array = await news.getNews(this.configuration.selectors.news); // Вызов функции getNews класса News с записью возвращаемого значения в переменную News_array
            if (pageFunc != undefined) News_array = await pageFunc(News_array); // Если дополнительно была передана функция постобработки результатов - выполняем ее
        }
        return _.flatten(News_array); // Приведение исходного массива к одномерному
    }
}