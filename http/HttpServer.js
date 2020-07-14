const args = require('../config');
const httpApp = require('./HttpApp');
const logger = require('../log/Log');
const browserManager =  require('../chromium/BrowserManager');
const Koa = require('koa');
const bodyParser = require("koa-bodyparser");
const fs = require('fs');
const path = require('path');
const square = require('../square/Square');

class LiveSystem{

    constructor() {
        const openLiveHandler = this.openLive.bind(this);
        const startLiveHandler = this.startLive.bind(this);
        const closeLiveHandler = this.closeLive.bind(this);
        const downLiveFileHandler = this.downLiveFile.bind(this);
        const startSquareHandler = this.startSquare.bind(this);
        const stopSquareHandler = this.stopSquare.bind(this);
        const addSquareHandler = this.addSquare.bind(this);
        const delSquareHandler = this.delSquare.bind(this);
        httpApp.register('/liveComponent/live/openLive', openLiveHandler);  //开启直播
        httpApp.register('/liveComponent/live/startLive', startLiveHandler);  //开启直播
        httpApp.register('/liveComponent/live/closeLive', closeLiveHandler);    //关闭直播
        httpApp.register('/liveComponent/live/downLiveFile', downLiveFileHandler);//下载直播文件
        httpApp.register('/liveComponent/square/startSquare', startSquareHandler);//开启测试
        httpApp.register('/liveComponent/square/stopSquare', stopSquareHandler);//停止测试
        httpApp.register('/liveComponent/square/addSquare', addSquareHandler);//新增方数
        httpApp.register('/liveComponent/square/delSquare', delSquareHandler);//删除方数
    }

    async startLive(option, ctx){
        try {
            if (!option.browserId || option.browserId === ''){
                ctx.throw(400, 'browserId不能为空')
            }
            if (!option.pageId || option.pageId === ''){
                ctx.throw(400, 'pageId不能为空')
            }
            const pageContext = await this.pageManager.getPageContext(option.browserId, option.pageId);
            if (pageContext.status == 'ready'){
                await pageContext.startLive();
            }
            const responseBody = {
                ...pageContext.liveOption
            };
            ctx.response.status = 200;
            ctx.response.body = responseBody;
        }catch(err){
            ctx.response.status = 400;
            ctx.response.body = {
                message: err.message
            };
        }
    }

    async openLive(option, ctx){
        try{
            this.checkOption(option, ctx);
            const pageContext = await this.pageManager.openLivePage(option.openUrl, option.pageId);
            await pageContext.readyLive(option);
            if (option.now == true || option.now === undefined){
                option.now = true;
                await pageContext.startLive();
            }
            const responseBody = {
                browserId: pageContext.getBrowserContext().Id(),
                pageId: pageContext.Id(),
                openUrl: pageContext.get_url(),
                ...option,
                fileName: pageContext.getLiveOption().fileName,
                liveUrl: option.liveUrl+'CrLiveConnect-'+pageContext.Id(),
            };
            ctx.response.status = 200;
            ctx.response.body = responseBody;
        }catch(err){
            ctx.response.status = err.statusCode;
            ctx.response.body = {
                message: err.message
            };
        }
    }

    async downLiveFile(option, ctx){
        if (!option.fileName || option.fileName === ''){
            ctx.throw(400, 'fileName不能为空')
        }

        const pathUrl = path.join(args.liveDownLoadDir, option.fileName+'.webm');
        ctx.body = fs.createReadStream(pathUrl);
    }

    async closeLive(option, ctx){
        try {
            if (!option.browserId || option.browserId === ''){
                ctx.throw(400, 'browserId不能为空')
            }
            if (!option.pageId || option.pageId === ''){
                ctx.throw(400, 'pageId不能为空')
            }
            const pageContext = await this.pageManager.getPageContext(option.browserId, option.pageId);
            const fileName = pageContext.getLiveOption().fileName;
            const responseBody = {
                ...option,
                fileName: fileName
            };
            await pageContext.stopLive();
            ctx.response.status = 200;
            ctx.response.body = responseBody;
        }catch(err){
            ctx.response.status = 400;
            ctx.response.body = {
                message: err.message
            };
        }
    }

    async startSquare(option, ctx){
        if (option.squareNumber){
            const squareNumber = option.squareNumber * 1;
            if (typeof squareNumber !== 'number' || squareNumber %  1 !== 0){
                ctx.throw(400, 'squareNumber 错误, squareNumber:' + option.squareNumber);
            }else {
                option.squareNumber = squareNumber;
            }
        }else {
            ctx.throw(400, 'squareNumber不能为空');
        }
        if (!option.openUrl || option.openUrl ===  ''){
            ctx.throw(400, 'openUrl不能为空')
        }
        const newOption = await square.startSquare(option);
        if (newOption){
            ctx.response.status = 200;
            const responseBody = {
                message: '开启成功',
                ...newOption
            };
            ctx.response.body = responseBody;
        }else {
            ctx.response.status = 400;
            ctx.response.body = {
                message: '当前已经开启方数测试'
            };
        }
    }

    async stopSquare(option, ctx){
        if (square.stopSquare()){
            ctx.response.status = 200;
            const responseBody = {
                message: '关闭成功'
            };
            ctx.response.body = responseBody;
        }else {
            ctx.response.status = 400;
            ctx.response.body = {
                message: '当前未开启方数测试'
            };
        }
    }

    async addSquare(option, ctx){
        if (option.squareNumber){
            const squareNumber = option.squareNumber * 1;
            if (typeof squareNumber !== 'number' || squareNumber %  1 !== 0){
                ctx.throw(400, 'squareNumber 错误, squareNumber:' + option.squareNumber);
            }else {
                option.squareNumber = squareNumber;
            }
        }else {
            ctx.throw(400, 'squareNumber不能为空');
        }
        const newOption = await square.addSquare(option.squareNumber, option.openUrl);
        if (newOption){
            ctx.response.status = 200;
            const responseBody = {
                message: '新增成功',
                ...newOption
            };
            ctx.response.body = responseBody;
        }else {
            ctx.response.status = 400;
            ctx.response.body = {
                message: '当前未开启方数测试'
            };
        }
    }

    async delSquare(option, ctx){
        if (option.squareNumber){
            const squareNumber = option.squareNumber * 1;
            if (typeof squareNumber !== 'number' || squareNumber %  1 !== 0){
                ctx.throw(400, 'squareNumber 错误, squareNumber:' + option.squareNumber);
            }else {
                option.squareNumber = squareNumber;
            }
        }else {
            ctx.throw(400, 'squareNumber不能为空');
        }
        const newOption = await square.delSquare(option.squareNumber);
        if (newOption){
            ctx.response.status = 200;
            const responseBody = {
                message: '删除成功',
                ...newOption
            };
            ctx.response.body = responseBody;
        }else if (newOption===false){
            ctx.response.status = 400;
            ctx.response.body = {
                message: '当前未开启方数测试'
            };
        }else {
            ctx.response.status = 200;
            ctx.response.body = {
                message: '关闭完成，由于当前测试方数已经为0，已经自动关闭测试'
            };
        }
    }


    async start() {
        const app = new Koa();
        const that = this;
        app.use(bodyParser()).
        use(httpApp.resolve).
        use(await httpApp.handlerData).on('error', (err, ctx) => {
            logger.error('server error', err, ctx)
        });

        app.listen(args.httpPort, args.hostname, async function () {
            that.pageManager = await browserManager.init(args);
            logger.info('CrLiveComponent start success: port: '+args.httpPort+', hostname: '+args.hostname);
        });
    }

    checkOption(option, ctx){
        const liveTypeNumber = option.liveType * 1;
        if (option.liveType){
            if (liveTypeNumber > 2 || liveTypeNumber < 0 || typeof liveTypeNumber !== 'number' || liveTypeNumber %  1 !== 0 ){
                ctx.throw(400, 'liveType 错误, liveType:' + option.liveType);
            }else {
                option.liveType = liveTypeNumber;
            }
        }else {
            ctx.throw(400, 'liveType 错误, liveType:' + option.liveType);
        }
        if (!option.openUrl || option.openUrl ===  ''){
            ctx.throw(400, 'openUrl不能为空')
        }
        if (liveTypeNumber !== 1 && (!option.liveUrl || option.liveUrl === '')){
            ctx.throw(400, 'liveUrl不能为空')
        }
        if (liveTypeNumber !== 1 && (!option.format || option.format === '')){
            ctx.throw(400, 'format不能为空')
        }
        if (!option.fileName || option.fileName === ''){
            ctx.throw(400, 'fileName不能为空');
        }
        return true;
    }

}
const liveSystem = new LiveSystem();
module.exports = liveSystem;

