import fs from 'fs'
import appRoot from 'app-root-path'

export function toTextFile(message) {
    const filePath = `${appRoot}/logs/newser_bot.txt`
    try {
        if (!fs.existsSync(filePath)) {
            fs.open(filePath, 'w', (err) => {
                if (err) throw err;
                console.log('Создан файл логов');
            });
        }
        fs.appendFileSync(filePath, new Date(Date.now()).toLocaleDateString() + ' ' + new Date(Date.now()).toLocaleTimeString() + ': ' + message + '\n');
    } catch (err) {
        console.log(err)
    }
}