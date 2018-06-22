function mapLimit(arr, fn, limit = 1) {
    if (!Array.isArray(arr)) {
        throw '第一个参数必须为数组';
    }
    if (typeof fn != 'function') {
        throw '第二个参数必须为函数';
    }
    if ((typeof limit != 'undefined' && typeof limit != 'number') || !Number.isInteger(limit) || limit <= 0) {
        throw '第三个参数必须为正整数'
    }

    return new Promise(async (resolve, reject) => {
        let all = arr.length;//总体请求数
        let now = 0;//当前位置指针
        let concurrency = 0;//当前并发数
        let resolveCount = 0;//完成的数量
        let resArr = [];//结果数组

        arr = arr.map((item, index) => ({ index, value: item }));

        function sendOne() {
            //如果已经全部请求完毕
            if (now >= all) {
                return;
            }

            let { value, index } = arr[now];
            //now指向下一个item
            now++;
            //并发数+1
            concurrency++;

            //如果当前并发数小于限制，则再发一个请求
            if (concurrency < limit) {
                sendOne();
            }

            //正式发送请求
            let promise = fn(value);

            if (!(promise instanceof Promise)) {
                throw '第二个参数必须返回一个promise';
            }

            promise.then((data) => {
                concurrency--;
                resolveCount++;
                resArr[index] = data;

                if (resolveCount >= all) {
                    resolve(resArr);
                }
                if (concurrency < limit) {
                    sendOne();
                }
            });
        }

        sendOne();
    });
}

function mapLimit2(arr, fn, limit = 1) {
    if (!Array.isArray(arr)) {
        throw '第一个参数必须为数组';
    }
    if (typeof fn != 'function') {
        throw '第二个参数必须为函数';
    }
    if ((typeof limit != 'undefined' && typeof limit != 'number') || !Number.isInteger(limit) || limit <= 0) {
        throw '第三个参数必须为正整数'
    }

    let EventEmitter = require('events').EventEmitter;
    let events = new EventEmitter();

    return new Promise(async (resolve, reject) => {
        let all = arr.length;//总体请求数
        let now = 0;//当前位置指针
        let concurrency = 0;//当前并发数
        let resolveCount = 0;//完成的数量
        let resArr = [];//结果数组

        arr = arr.map((item, index) => ({ index, value: item }));

        events.on('out', ({data,index}) => {
            concurrency--;
            resolveCount++;
            resArr[index] = data;

            if (resolveCount >= all) {
                resolve(resArr);
            }
            if (concurrency < limit) {
                sendOne();
            }
        });

        function sendOne() {
            //如果已经全部请求完毕
            if (now >= all) {
                return;
            }

            let { value, index } = arr[now];
            //now指向下一个item
            now++;
            //并发数+1
            concurrency++;

            //如果当前并发数小于限制，则再发一个请求
            if (concurrency < limit) {
                sendOne(now);
            }

            //正式发送请求
            let promise = fn(value);

            if (!(promise instanceof Promise)) {
                throw '第二个参数必须返回一个promise';
            }

            promise.then((data) => {
                events.emit('out',{data,index});
            });
        }

        sendOne();
    });
}