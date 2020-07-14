var log4js = require('log4js');
var logMaster = require('log-master');

logMaster.split({ //切割，目前唯一的功能
    "from": { //源文件夹，可多选。
        "Live": "./logs/"
    },
    "Suffix": [".log"], //要切割的文件类型，可多选。默认 [".log"]
    "to": "./logs/date/", //目标文件夹,log都会到这里。
    "Interval": 1000 * 60 * 60 * 24, //切割时间间隔，默认一天。
    "timeFormat": "yyyy-MM-dd", //时间格式(生成的文件夹名),默认为yyyy年MM月dd日HH时mm分ss秒
    "startTime": "23:59" //开始时间，默认零点,精确到秒的话就："00:00:00"
});

log4js.configure({
    appenders: {
        console:{ type: 'console' },
        LiveLogs:{ type: 'file', filename: 'logs/liveLog.log', category: 'live' }
    },
    categories: {

        default: {appenders: ['console', 'LiveLogs'], level: 'info'}

    }
});

const logger = log4js.getLogger('Live');
module.exports = logger;
