import ac from "@antiadmin/anticaptchaofficial"
ac.setAPIKey('97203e301632af0a78ff1ba36390b902');
ac.getBalance()
    .then(balance => console.log('my balance is $' + balance))
    .catch(error => console.log('received error ' + error))

const captcha = fs.readFileSync('captcha.png', { encoding: 'base64' });
ac.solveImage(captcha, true)
    .then(text => console.log('captcha text: ' + text))
    .catch(error => console.log('test received error ' + error));