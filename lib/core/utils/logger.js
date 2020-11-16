import fs from 'fs'
import appRoot from 'app-root-path'

export function toTextFile(text) {
    const filePath = `${appRoot}/logs/newser_bot.txt`
    try {
        if (!fs.existsSync(filePath)) {
            fs.open(filePath, 'w', (err) => {
                if (err) throw err;
            });
        }
        fs.appendFileSync(filePath, text + '\n');
    } catch (err) {
        console.log(err)
    }
}