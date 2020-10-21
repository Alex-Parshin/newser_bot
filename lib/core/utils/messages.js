'use strict'
const clc = require('cli-color');
const fs = require('fs');

class Messages {

    async showStart(now) {
        this.now = now;
        console.log(clc.green("Working!"));
        console.log(clc.green(this.now + " Получена команда START (ver. dev/1.0)"));
    }

    async loadComplete(now) {
        this.now = now;
        console.log(clc.green(this.now + " Запрос прогрузился!"));
    }

    async showEnd(now) {
        this.now = now;
        console.log(clc.green(this.now + " ***********Browser session end!**************"));
    }

    async showRelated() {
        console.log(clc.yellow("Начинаю обработку похожих новостей"));
    }

    async cantUrl(now, url) {
        this.now = now;
        this.url = url;
        console.log(clc.red(this.now + " Не могу перейти по ссылке " + this.url));
    }

    async countRelated(length) {
        this.length = length;
        console.log(clc.green("Похожих новостей: " + this.length));
    }

    async cantGetQuery(now) {
        this.now = now;
        console.log(clc.red(this.now + " Не могу получить запрос!"));
    }

    async showError(now, error) {
        this.now = now;
        this.error = error;
        console.log(this.error)
            // console.log(clc.red(this.now + " " + this.error));
    }

    async nextPage(now, page) {
        this.now = now;
        this.page = page;
        console.log(clc.yellow(this.now + " Переход на страницу " + (this.page + 2)));
    }

    async noNextPage(now) {
        this.now = now;
        console.log(clc.red(this.now + " Нет других страниц"));
    }

    async onPage(url) {
        this.url = url;
        console.log("На странице " + this.url);
    }

    async captchaCheck(now) {
        this.now = now;
        await console.log(clc.yellow(this.now + " Проверка капчи"));
    }

    async captchaAlert(now) {
        this.now = now;

        await console.log(clc.red(this.now + " КАПЧА!"));
    }

    async captchaResolve(now, c_response) {
        this.now = now;
        this.c_response = c_response;
        if (this.c_response.indexOf("Ошибка") != -1) {
            await console.log(clc.red(this.now + " " + c_response));
        } else {
            await console.log(clc.green(this.now + " Капча обработана! " + this.c_response));
        }
    }

    async noCaptcha(now) {
        this.now = now;

        await console.log(now + " Капчи нет");
    }

    async showInitStat(finishTime, startTime) {
        this.finishTime = finishTime;
        this.startTime = startTime;

        var proceedTime = (this.finishTime - this.startTime) / 1000;

        await console.log("***************************************************");
        await console.log(clc.yellow("Обработка запроса заняла " + proceedTime + " секунд"));
    }

    async showDialog(now) {
        this.now = now;
        await console.log(this.now + " Добро пожаловать в меню первоначальной настройки работы поискового бота");
    }
}

module.exports = Messages;