'use strict'

const _ = require('underscore');

const WSW = require('../core/struct/wsw');

class Google extends WSW {

    constructor(page, pages, query, configuration, id_request, id_engine, socket) {
        super(page, pages, query, id_engine, configuration.engines.google, id_request, socket);
    }

    async index() {
        var pageFunc = async(News_array) => {
            News_array.splice(0, 34);
            for (let i = 0; i < News_array.length; i++) {
                try {
                    News_array[i].href = News_array[i].href.split('/')[2];
                    News_array[i].href = Buffer.from(News_array[i].href, 'base64').toString('utf-8');
                    var url = News_array[i].href.split('//')[1];
                    url = url.replace(/[^0-9A-Za-zА-Яа-яЁё:/\\?#_.-]/g, "").replace(/^0-9A-Za-zА-Яа-яЁё+|https:$/g, "");
                    News_array[i].href = 'https://' + url;
                } catch (e) {
                    delete News_array[i];
                }
            }
            News_array = News_array.filter(function(el) {
                return el != null;
            });
            return _.flatten(News_array);
        }
        return await super.index(pageFunc);
    }
}

module.exports = Google;