class Test {
    constructor() {
        this.testMsg = 'test'
    }

    test() {
        console.log(this.testMsg)
        this.test2Msg = 123
    }

    test2() {
        console.log(this.test2Msg)
    }
}

const test = new Test()
test.test()
test.test2()