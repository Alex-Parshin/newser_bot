'use strict'
import _ from 'underscore'

import WSC from '../core/struct/wsc'
import store from './../core/state/stateManager'

export default class Rambler extends WSC {
    constructor(singleQueryData) {
        super(singleQueryData, store.getConfig().engines.rambler);
    }
}