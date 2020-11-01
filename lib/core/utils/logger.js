import fs from 'fs'
import path from 'path'

export function toTextFile(message) {
    const filePath = `${path.resolve()}/data/logs/newser-server.txt`
    try {
        if (!fs.existsSync(filePath)) {
            fs.open('testFile.txt', 'w', (err) => {
                if(err) throw err;
                console.log('Создан файл логов');
            });
        }
        fs.appendFileSync(filePath, new Date(Date.now()).toLocaleDateString() + ' ' + new Date(Date.now()).toLocaleTimeString() + ': ' + message + '\n');
    } catch (err) {
        console.log(err)
    }
}