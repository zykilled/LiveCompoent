const logger = require('../log/Log');
const BrowserContext = require('./BrowserContext');
const uuid = require('node-uuid');
const {Events} = require('../event/Events');
const EventEmitter = require('events');
const pageManager = require('./page/PageManager');

/**
 * 用于管理当前服务器所有对browser.
 */
class BrowserManager extends EventEmitter{

    constructor(){
        super();
        let map = new Map();
        this.browserMap = map;
        pageManager.init(this);
    }

    //初始化
    init(option){
        this.option = option;
        if (this.option.browserNumThreshold === undefined || this.option.browserNumThreshold === null){
            this.option.browserNumThreshold = 6;
        }
        return pageManager;
    }

    getPageManager(){
        return pageManager;
    }

    async getBrowserOne(browserContextId = ''){
        if (browserContextId === ''){
            for (const [key, value] of this.browserMap) {
                const browserContext = value;
                if (browserContext.getOpenNum() < this.option.browserNumThreshold){
                    return browserContext;
                }
            }
            const browserContext = this.createBrowser(browserContextId);
            await browserContext.start();
            return browserContext;
        }else {
            const browserContext = this.browserMap.get(browserContextId);
            return browserContext;
        }
    }

    //创建一个Browser
    createBrowser(browserContextId = '', option = this.option){
        if (browserContextId === ''  || browserContextId === undefined){
            browserContextId = uuid.v1();
        }
        const browserContext =  new BrowserContext(option, browserContextId);
        browserContext.on(Events.Browser.ChromiumError, (event)=>{
            this.chromiumError(event);
        });
        browserContext.on(Events.Browser.AutonomousClose, (event)=>{
            this.chromiumClose(event);
        });
        browserContext.on(Events.Browser.Disconnected, (event)=>{
            this.chromiumDisConnect(event);
        });
        browserContext.on(Events.Browser.CreateSuccess, (event)=>{
            this.chromiumStartSuccess(event);
        });
        browserContext.on(Events.Browser.CreateFail, (event)=>{
            this.chromiumStartFail(event);
        });
        this.browserMap.set(browserContextId,  browserContext);
        pageManager.pageInBrowser(browserContext.Id());
        logger.info('browserManager => 创建browser完毕, browserId: ' + browserContextId);
        return browserContext;
    }

    getBrowserContextForId(browserContextId){
        if (this.browserMap.has(browserContextId)){
            return this.browserMap.get(browserContextId);
        }
        return undefined;
    }

    //销毁一个Browser
    async destroyBrowser(browserContextId){
        if (browserContextId === '' || browserContextId === undefined){
            return ;
        }
        if (this.browserMap.has(browserContextId)){
            const browserContext = this.browserMap.get(browserContextId);
            logger.info('browserManager => 销毁browser, browserId: ' + browserContext.Id());
            pageManager.destroyBrowser(browserContext);
            await browserContext.close();
        }
    }

    //chromium崩溃
    chromiumError(event){
        if (this.browserMap.has(event.id)){
            const browserContext = this.browserMap.get(event.id);
            this.removePageListener(browserContext);
            browserContext.destroy();
            this.browserMap.delete(event.id);
            this.emit(Events.Browser.BrowserListener, {id: event.id, targetEvent: Events.Browser.ChromiumError})
        }
    }

    //和chromium断开连接
    chromiumDisConnect(event){
        this.emit(Events.Browser.BrowserListener, {id: event.id, targetEvent: Events.Browser.Disconnected})
    }

    //关闭chromium
    chromiumClose(event){
        if (this.browserMap.has(event.id)){
            const browserContext = this.browserMap.get(event.id);
            this.removePageListener(browserContext);
            browserContext.destroy();
            this.browserMap.delete(event.id);
            this.emit(Events.Browser.BrowserListener, {id: event.id, targetEvent: Events.Browser.AutonomousClose})
        }
    }

    chromiumStartSuccess(event){
        logger.info('browserManager => 启动browser成功, browserId: ' + event.id);
        this.emit(Events.Browser.BrowserListener, {id: event.id, targetEvent: Events.Browser.CreateSuccess})
    }

    chromiumStartFail(event){
        this.emit(Events.Browser.BrowserListener, {id: event.id, targetEvent: Events.Browser.CreateFail, error: event.e})
    }

    //移除监听
    removePageListener(browserContext){
        browserContext.removeAllListeners();
    }
}

const browserManager = new BrowserManager();
module.exports = browserManager;