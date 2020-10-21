const fs = require('fs')
const filePath = process.env.FILEPATH;
class Logger {

    toTextFile(message) {
        try {
            fs.appendFileSync(filePath, `\n ${new Date(Date.now())} ${message}`);
        } catch (err) {
            console.log(err)
        }
    }
}

module.exports = Logger;