
const logger = require('../../log/Log');
const EventEmitter = require('events');
const uuid = require('node-uuid');
const {Events} = require('../../event/Events');
const socketServer = require('../../websocket/SocketServer');
const pageManager = require('./PageManager');
const moment = require('moment');
class PageContext extends EventEmitter{

    constructor(page, browserContext){
        super();
        this.page = page;
        this.uuid = uuid.v1();
        this.browserContext = browserContext;
        this.page.on(Events.Page.Close, () => {
            this.closed();
        });
        this.page.on(Events.Page.Error, (event)=>{
            this.pageCollapse(event);
        });
        this.page.on(Events.Page.PageError, (event)=>{
            this.pageError(event);
        });
        this.page.on(Events.Page.Load, ()=>{
            this.loadOver();
        });
    }

    renameId(id){
        this.uuid = id;
    }

    /**
     * 获取当前页面唯一Id
     * @returns {*}
     * @constructor
     */
    Id(){
        return this.uuid;
    }

    /**
     * 获取当前页面所属browser
     * @returns {*}
     */
    getBrowserContext(){
        return this.browserContext;
    }

    closed(){
        this.removePageListener(this.page);
        if (!this.closeTargetEvent){
            this.closeTargetEvent = {
                type: Events.Page.PageErrorClose,
                reason: '页面被点击关闭'
            }

        }
        logger.warn('page => 页面关闭, pageId: ' + this.uuid +', url: '+ this.get_url()+', 关闭类型: ' + this.closeTargetEvent.type + '，关闭原因: '+
            this.closeTargetEvent.reason);
        this.emit(Events.Page.Close, {id: this.uuid, loadPage: this, closeTargetEvent: this.closeTargetEvent});
    }

    pageCollapse(error){
        logger.error('page => 页面崩溃, pageId: '+ this.uuid + ', url:' + this.get_url() + ", 错误代码: "+ error.code+ '\n' + error.stack );
        this.emit(Events.Page.Error, {id: this.uuid, url: this.get_url(), error: error, loadPage: this});
    }

    pageError(error){
        logger.error('page => 页面错误, pageId:'+ this.uuid + ', url:' + this.get_url() + ", 错误代码: "+ error.code+ '\n' + error.stack );
        this.emit(Events.Page.PageError, {id: this.uuid, url: this.get_url(), error: error, loadPage: this});
    }

    loadOver(){
        logger.info('page => 直播页面加载完成, pageId: ' + this.uuid +', url: '+ this.get_url());
        this.emit(Events.Page.Load, {id: this.uuid, url: this.get_url(), loadPage: this});
    }

    //加载直播页面
    async loadUrl(url){
        try {
            this.url = url;
            logger.info('page => 跳转至直播地址, pageId: ' + this.uuid +', url: '+ url);
            await this.page._client.send('Emulation.clearDeviceMetricsOverride');
            const result = await this.page.goto(url, {waitUntil: 'load'});
            await this.page.setBypassCSP(true);
            if (result.status() !== 200) {
                const error = new Error(result.statusText());
                error.code = result.status();
                logger.error('page => 页面跳转失败, pageId:'+ this.uuid + ', url:' + url + ", 错误代码: "+ error.code+ '\n' + error.stack );
                this.emit(Events.Page.PageError, {id: this.uuid, url: url, error: error, loadPage: this});
            }else {
                await this.page._client.send('Emulation.clearDeviceMetricsOverride')
                // Sleep.sleep(10000);
                await this.setCallBack();

            }
        }catch (e) {
            logger.error('page => 页面跳转失败, pageId:'+ this.uuid + ', url:' + url + ", 错误代码: "+ e.code+ '\n' + e.stack );
            this.emit(Events.Page.PageError, {id: this.uuid, url: url, error: e, loadPage: this});
        }
    }

    //设置消息回调
    async setCallBack(){
        await this.evaluate(() => {
            window.addEventListener('message', (event)=>{
                if (event.data.Response){
                    console.log(event.data.Response);
                    const message = JSON.stringify(event.data.Response);
                    window.videoDataSend(message);
                }
            });
        });
        const that = this;
        await this.page.exposeFunction('videoDataSend', (msg) => {
            that.callBack(msg);
        });

    }

    async callBack(msg){
        const response = JSON.parse(msg);
        //连接成功,开始直播
        if (response.type === 'connect'){
            // await this.evaluate(()=>{
            //     const jq = document.createElement("script");
            //     var t = document.createTextNode(
            //         "var body = document.body;\nvar hr = document.createElement('hr');\n" +
            //         "hr.size=\"1\";\nhr.id=\"hr\";\n" +
            //         "hr.style.zIndex=9999;\n" +
            //         "hr.style.position=\'fixed\';" +
            //         "hr.style.top=\'0px\';" +
            //         "hr.style.width=\'100%\';"+
            //         "body.appendChild(hr);\nvar xianshi=true;\n" +
            //         "setInterval(function (){\nif(xianshi){\nhr.style.display=\'none\';\n xianshi=false; \n}else{\n" +
            //         "xianshi=true;\nhr.style.display=\'block\'\n}\n}, 1000)"
            //     );
            //     jq.appendChild(t);
            //     console.log(jq);
            //     document.body.appendChild(jq);
            // });
            socketServer.readyNewOpen('CrLiveConnect-'+this.Id(),  this.liveOption);
            // //通知插件开始直播
            await this.liveOpen(this.liveOption.liveType);
            this.status = 'live';
        }
        if (response.type === 'start'){
            if (this.liveOption.liveType === 1){
                logger.info('page => 开启录制, pageId: ' + this.uuid);
            }else if (this.liveOption.liveType === 2){
                logger.info('page => 开启录制与直播, pageId: ' + this.uuid);
            }else {
                logger.info('page => 开启直播, pageId: ' + this.uuid);
            }
        }
        if (response.type === 'pause'){
            if (this.liveOption.liveType === 1){
                logger.info('page => 暂停录制, pageId: ' + this.uuid);
            }else if (this.liveOption.liveType === 2){
                logger.info('page => 暂停录制与直播, pageId: ' + this.uuid);
            }else {
                logger.info('page => 暂停直播, pageId: ' + this.uuid);
            }
            this.status = 'pause';
        }
        if (response.type === 'resume'){
            if (this.liveOption.liveType === 1){
                logger.info('page => 重启录制, pageId: ' + this.uuid);
            }else if (this.liveOption.liveType === 2){
                logger.info('page => 重启录制与直播, pageId: ' + this.uuid);
            }else {
                logger.info('page => 重启直播, pageId: ' + this.uuid);
            }
            this.status = 'live';
        }
        if (response.type === 'stop'){
            await this.closeJsLive();
            socketServer.stop('CrLiveConnect-'+this.Id());
            if (this.liveOption.liveType === 1){
                await this.startDownloadRecord(response);
                pageManager.closePage(this.browserContext.Id(), this.Id(), '停止录制');
            }else if (this.liveOption.liveType === 0){
                pageManager.closePage(this.browserContext.Id(), this.Id(), '停止直播');
            }else {
                await this.startDownloadRecord(response);
                pageManager.closePage(this.browserContext.Id(), this.Id(), '停止录制与直播');
            }

        }
        if (response.type === 'square'){
            logger.info('page => 开启方数测试, pageId: ' + this.uuid+', 测试地址: '+ this.get_url());
        }
    }

    //使用puppeteer脚本植入下载文件(之所以不使用插件下载，因为puppeteer没有提供设置默认下载文件夹的方法)
    async startDownloadRecord(response){
        const downloadUrl = response.msg.msg;
        if (downloadUrl !== ''){
            const that = this;
            const fileName = this.liveOption.fileName+'.webm';
            that.page.evaluate((file)=> {
                const a = document.createElement('a');
                a.id = 'downloadFile';
                const downloadAddress = file.split('####');
                a.href = downloadAddress[0];
                console.log(downloadAddress);
                a.download = downloadAddress[1];
                document.body.appendChild(a);
                a.click();
                a.remove();
            }, downloadUrl+'####'+fileName)
        }else {
            logger.error('page => 开始下载错误, 当前URL地址为空, pageId: ' + this.uuid);
        }
    }

    async closeJsLive(){
        const request = {Request:{type: 'close', Data:{id: this.Id()}, target: 'closeJsLive'}};
        await this.evaluate((request) => {
            window.postMessage(request[0],'*');
        }, request);
    }

    async liveOpen(liveType){
        await this.page.bringToFront();
        const request = {Request:{type: 'start', Data:{id: this.Id(),liveType: liveType, name: this.liveOption.fileName, socketPort: 16547}, target: 'startLive'}};
        await this.evaluate(request => {
            window.postMessage(request[0],'*');
        }, request);
    }

    async stopLive(){
        if (this.status === 'live' ||
            this.status === 'pause'){
            const request = {Request:{type: 'stop', Data:{id: this.Id()}, target: 'stopLive'}};
            await this.evaluate((request) => {
                window.postMessage(request[0],'*');
            }, request);
        }
    }

    //准备直播直播
    async readyLive(liveOption){
        //开始连接插件
        this.liveOption = {liveType: 0, ...liveOption, pageId: this.Id()}
        const current_time =  moment(Date.now()).format('YYYYMMDDHHmm');
        const fileName = this.liveOption.fileName+'-'+current_time;
        this.liveOption.fileName = fileName;
        await this.page.bringToFront();
        this.status = 'ready';
        return this;
    }

    //开启直播
    async startLive(){
        await this.page.bringToFront();
        const request = {Request:{type: 'connect', Data:{id: this.Id()}, target: 'connectJsLive'}};
        await this.evaluate((request) => {
            window.postMessage(request[0],'*');
        }, request);
        return this;
    }


    async pauseLive(){
        if (this.status === 'live'){
            socketServer.pause('CrLiveConnect-'+this.Id());
            const request = {Request:{type: 'pause', Data:{id: this.Id()}, target: 'pauseLive'}};
            await this.evaluate((request) => {
                window.postMessage(request[0],'*');
            }, request);
        }

    }

    async resumeLive(){
        if (this.status === 'pause'){
            socketServer.resume('CrLiveConnect-'+this.Id());
            const request = {Request:{type: 'resume', Data:{id: this.Id()}, target: 'resumeLive'}};
            await this.evaluate((request) => {
                window.postMessage(request[0],'*');
            }, request);
        }
    }

    //关闭页面
    close(targetEvent){
        //关闭页面的原因
        this.closeTargetEvent = targetEvent;
        this.page.close();
    }

    //执行js方法
    async evaluate(pageFunction, ...args){
        if (!this.browserContext.status()){
            this.browserContext.connect();
        }
        await this.page.evaluate(pageFunction, args);
    }

    getLiveOption(){
        return this.liveOption;
    }

    //获取当前页面的url
    get_url(){
        return this.url;
    }

    //移除监听
    removePageListener(page){
        page.removeAllListeners();
    }

};

module.exports = PageContext;