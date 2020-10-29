'use strict'
import _ from 'underscore'

import WSC from '../core/struct/wsc'
import store from './../core/state/stateManager'

export default class Rambler extends WSC {
    constructor() {
        super(store.getConfig().engines.rambler);
    }
}