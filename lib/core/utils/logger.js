import fs from 'fs'
import path from 'path'

export function toTextFile(message) {
    try {
        fs.appendFileSync(`${path.resolve()}/data/logs/newser-server.txt`, new Date(Date.now()) + ' ' + message + '\n');
    } catch (err) {
        console.log(err)
    }
}