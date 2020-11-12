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
        switch (News_date_arr[2]) {
            case 'января':
                News_date_arr[2] = "01";
                break;
            case 'февраля':
                News_date_arr[2] = "02";
                break;
            case 'марта':
                News_date_arr[2] = "03";
                break;
            case 'апреля':
                News_date_arr[2] = "04";
                break;
            case 'мая':
                News_date_arr[2] = "05";
                break;
            case 'июня':
                News_date_arr[2] = "06";
                break;
            case 'июля':
                News_date_arr[2] = "07";
                break;
            case 'августа':
                News_date_arr[2] = "08";
                break;
            case 'сентября':
                News_date_arr[2] = "09";
                break;
            case 'октября':
                News_date_arr[2] = "10";
                break;
            case 'ноября':
                News_date_arr[2] = "11";
                break;
            case 'декабря':
                News_date_arr[2] = "12";
                break;
            default:
                log('Не могу определить месяц (yandex)')
        }
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
        switch (News_date_arr[2].slice(0, -1)) {
            case 'января':
                News_date_arr[2] = "01";
                break;
            case 'февраля':
                News_date_arr[2] = "02";
                break;
            case 'марта':
                News_date_arr[2] = "03";
                break;
            case 'апреля':
                News_date_arr[2] = "04";
                break;
            case 'мая':
                News_date_arr[2] = "05";
                break;
            case 'июня':
                News_date_arr[2] = "06";
                break;
            case 'июля':
                News_date_arr[2] = "07";
                break;
            case 'августа':
                News_date_arr[2] = "08";
                break;
            case 'сентября':
                News_date_arr[2] = "09";
                break;
            case 'октября':
                News_date_arr[2] = "10";
                break;
            case 'ноября':
                News_date_arr[2] = "11";
                break;
            case 'декабря':
                News_date_arr[2] = "12";
                break;
            default:
                log('Не могу определить месяц (rambler)')
        }
        date_str = d.getFullYear() + "-" + News_date_arr[2] + "-" + News_date_arr[0];
        time = News_date_arr[4];
    } else {
        switch (News_date_arr[2]) {
            case 'января':
                News_date_arr[2] = "01";
                break;
            case 'февраля':
                News_date_arr[2] = "02";
                break;
            case 'марта':
                News_date_arr[2] = "03";
                break;
            case 'апреля':
                News_date_arr[2] = "04";
                break;
            case 'мая':
                News_date_arr[2] = "05";
                break;
            case 'июня':
                News_date_arr[2] = "06";
                break;
            case 'июля':
                News_date_arr[2] = "07";
                break;
            case 'августа':
                News_date_arr[2] = "08";
                break;
            case 'сентября':
                News_date_arr[2] = "09";
                break;
            case 'октября':
                News_date_arr[2] = "10";
                break;
            case 'ноября':
                News_date_arr[2] = "11";
                break;
            case 'декабря':
                News_date_arr[2] = "12";
                break;
            default:
                log('Не могу определить месяц (rambler)')
        }
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