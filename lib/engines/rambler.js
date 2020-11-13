'use strict'

import _ from 'underscore'
import WSC from '../core/struct/wsc'

export default class Rambler extends WSC {
    constructor(singleQueryData) {
        super(singleQueryData, singleQueryData.config.engines.rambler);
    }
}