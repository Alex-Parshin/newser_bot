'use strict'

const socket = require("socket.io");

class Socket {

	constructor(server = {}) {
		
		if (Socket.exists == true) {
			return Socket.instance
		}

		Socket.exists = true
		Socket.instance = this

		this.server = server
		this.io = socket(server)
	}

	listenEvent(event, cb) {
		this.io.on('connect', socket => {
			socket.on(event, (data) => {
				cb(data)
			})
		})
	}

	emitEvent(event, data) {
		this.io.on('connect', socket => {
			socket.emit(event, data)
		})
	}
}

module.exports = Socket