'use strict'
import _ from 'underscore'

import WSC from '../core/struct/wsc'

export default class Rambler extends WSC {
    constructor(page, pages, query, configuration, id_request, id_engine, socket) {
        super(page, pages, query, id_engine, configuration.engines.rambler, id_request, socket);
    }
}