'use strict'
const _ = require('underscore');

const WSC = require('../core/struct/wsc');

class Rambler extends WSC {
    constructor(page, pages, query, configuration, id_request, id_engine, socket) {
        super(page, pages, query, id_engine, configuration.engines.rambler, id_request, socket);
    }
}

module.exports = Rambler;