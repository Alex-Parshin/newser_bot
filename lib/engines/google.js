'use strict'

import _ from 'underscore'
import axios from 'axios'
import { parseString } from 'xml2js'
import store from './../core/state/stateManager'

import WSW from '../core/struct/wsw'

export default class Google extends WSW {

    constructor() {
        super(store.getConfig().engines.google)
        this.query = store.getQuery()
    }

    async index() {
        var pageFunc = async(News_array) => {
            News_array.splice(0, 34);
            for (let i = 0; i < News_array.length; i++) {
                try {
                    News_array[i].href = News_array[i].href.split('/')[2];
                    News_array[i].href = Buffer.from(News_array[i].href, 'base64').toString('utf-8');
                    let url = News_array[i].href.split('//')[1];
                    url = url.replace(/[^0-9A-Za-zА-Яа-яЁё:\/\\?#_.-]/g, "").replace(/^0-9A-Za-zА-Яа-яЁё+|https:$/g, "");
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

    async getRSS() {
        let News_array = []
        console.log(this.query)
        let url = `https://news.google.com/rss/search?q=${encodeURI(this.query)}&hl=ru&gl=RU&ceid=RU:ru`
        console.log(decodeURI(url))
        await axios.get(url)
            .then((response) => {
                try {
                    parseString(response.data, function(err, result) {
                        if (!err) {
                            const items = result.rss.channel[0].item
                            for (let i = 0; i < items.length; i++) {
                                let News = new Object({
                                    title: "",
                                    desc: "",
                                    agency: "",
                                    href: "",
                                    date: "",
                                    content: "",
                                    lead_img: "",
                                    sentimental: '',
                                    id_request: store.getIdRequest(),
                                    id_engine: store.getIdEngine()
                                });
                                News.title = items[i].title.join()
                                News.desc = items[i].description.join().split('>')[1].split('<')[0]
                                News.agency = items[i].source[0]._
                                News.href = decodeURI(items[i].link.join())
                                News.date = items[i].pubDate.join()
                                News_array.push(News)
                            }
                        }
                    });
                } catch (err) {
                    console.log(`Cannot parse XML from ${url}`)
                }
            })
        return News_array
    }
}