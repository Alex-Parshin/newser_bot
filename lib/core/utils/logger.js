import fs from 'fs'
import path from 'path'

export function toTextFile(message) {
    let filePath = `${path.resolve()}/data/logs/newser-server.txt`
    try {
        if (!fs.existsSync(filePath)) {
            fs.open('testFile.txt', 'w', (err) => {
                if(err) throw err;
                console.log('File created');
            });
        }
        fs.appendFileSync(filePath, new Date(Date.now()) + ' ' + message + '\n');
    } catch (err) {
        console.log(err)
    }
}