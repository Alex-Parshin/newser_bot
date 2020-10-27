const fs = require('fs')
const path = require('path')

class Logger {

    toTextFile(message) {
        try {
            fs.appendFileSync(`${path.resolve()}/data/logs/newser-server.txt`, new Date(Date.now()) + ' ' + message + '\n');
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = Logger;