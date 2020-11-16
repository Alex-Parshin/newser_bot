'use strict';

import _ from 'underscore'; // Импорт пакета для работы с массивами и объектами
import scrollPageToBottom from 'puppeteer-autoscroll-down'; // Импорт функции автопрокрутки

import News from '../news'; // Импорт класса для сбора новостных материалов

/**
 * @class WSW
 * @description Описывает процесс сбора новостей с сайтов, подгрузка новостей осуществляется путем прокрутки вниз страницы и ожидания загрузки
 * @param {Object} singleQueryData Данные для обработки конкретного запроса
 * @param {Object} configuration Конфигурация для определенного поискового сервиса
 */
export default class WSW {

    constructor(singleQueryData, configuration) {
        this.singleQueryData = singleQueryData;
        this.configuration = configuration;
    }

    /**
     * @method index
     * @description Управляет последовательностью действий, необходимых для сбора новостей
     * @param {Function} pageFunc Функция для корректного сбора URL-адресов 
     * @returns {Array} News_array
     */
    async index(pageFunc) {
        const news = new News(this.singleQueryData, this.configuration); // Инициализация класса News
        let News_array = []; // Объявление переменной для хранения результатов поиска новостей
        if (await news.getMainPage() == true) { // Проверка успешности перехода на главную страницу
            await scrollPageToBottom(this.singleQueryData.page, 200, 100); // Автопрокрутка вниз страницы
            News_array = await news.getNews(this.configuration.selectors.news); // Вызов функции getNews класса News с записью возвращаемого значения в переменную News_array
            if (pageFunc != undefined) News_array = await pageFunc(News_array, this.configuration); // Если дополнительно передана функция постобработки - выполнение
        }
        return _.flatten(News_array); // Приведение исходного массива к одномерному
    }
}