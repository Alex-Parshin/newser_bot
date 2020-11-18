'use strict'

import { log } from './utils'

export default function dateFormer(engine, date) {
    let result = [];
    switch (engine) {
        case 7:
            result = rambler(date);
            break;
        case 4:
            result = yandex(date);
            break;
        default:
            log(`Движок не определен: ${engine}`);
            throw "Error"
    }
    return result;
}

function yandex(date) {
    let time = "";
    let date_str = "";
    let News_date_arr = date.split(/(\s+)/);
    if (News_date_arr.length == 5) {
        if (News_date_arr[0].toLowerCase() == "вчера") {
            let d = new Date();

            d.setDate(d.getDate() - 1);

            if (Number(d.getMonth() + 1).toString().length == 1) {
                date_str = d.getFullYear() + '-' + "0" + Number(d.getMonth() + 1) + '-' + d.getDate();
            } else {
                date_str = d.getFullYear() + '-' + Number(d.getMonth() + 1) + '-' + d.getDate();
            }
        } else {
            let date_arr = News_date_arr[0].split('.');
            date_str = "20" + date_arr[2] + "-" + date_arr[1] + "-" + date_arr[0];
        }
        time = News_date_arr[4];
    } else if (News_date_arr.length == 7) {
        News_date_arr[2] = convertStringMonthToDigit(News_date_arr[2], 1, 'yandex')

        let d = new Date();
        date_str = d.getFullYear() + "-" + News_date_arr[2] + "-" + News_date_arr[0];
        time = News_date_arr[6];
    } else if (News_date_arr.length == 1) {
        let d = new Date();
        if ((d.getMonth() + 1).toString().length == 1) {
            date_str = d.getFullYear() + "-" + "0" + Number(d.getMonth() + 1) + "-" + d.getDate();
        } else {
            date_str = d.getFullYear() + "-" + Number(d.getMonth() + 1) + "-" + d.getDate();
        }
        time = News_date_arr[0];
    }
    return [date_str, time]
}

function rambler(date) {
    let time = "";
    let News_date_arr = date.split(/(\s+)/);
    let d = new Date();
    let date_str = "";

    if (News_date_arr[2].indexOf(',') != -1) {
        News_date_arr[2] = convertStringMonthToDigit(News_date_arr[2], 2, 'rambler')
        date_str = d.getFullYear() + "-" + News_date_arr[2] + "-" + News_date_arr[0];
        time = News_date_arr[4];
    } else {
        News_date_arr[2] = convertStringMonthToDigit(News_date_arr[2], 1, 'rambler')

        if (News_date_arr[0].length === 1) News_date_arr[0] = `0${News_date_arr[0].toString()}`
        date_str = News_date_arr[4] + "-" + News_date_arr[2] + "-" + News_date_arr[0];

        time = new Date(Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }
    return [date_str, time]
}

function convertStringMonthToDigit(data, type, source) {
    if (type === 2) data = data.slice(0, -1)
    switch (data) {
        case 'января':
            data = "01";
            break;
        case 'февраля':
            data = "02";
            break;
        case 'марта':
            data = "03";
            break;
        case 'апреля':
            data = "04";
            break;
        case 'мая':
            data = "05";
            break;
        case 'июня':
            data = "06";
            break;
        case 'июля':
            data = "07";
            break;
        case 'августа':
            data = "08";
            break;
        case 'сентября':
            data = "09";
            break;
        case 'октября':
            data = "10";
            break;
        case 'ноября':
            data = "11";
            break;
        case 'декабря':
            data = "12";
            break;
        default:
            log(`Не могу определить месяц в ${source}`)
    }
    return data
}