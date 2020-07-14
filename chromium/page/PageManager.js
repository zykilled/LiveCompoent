
const logger = require('../../log/Log');
const {Events} = require('../../event/Events');
const EventEmitter = require('events');
const uuid = require('node-uuid');

/**
 * 用于管理当前服务器上所有的page
 */
class PageManager extends EventEmitter{

    constructor() {
        super();
        const map = new Map();
        this.browserForPageMap = map;
    }

    init(browserManager){
        this.browserManager = browserManager;
    }

    getBrowserManager(){
        return this.browserManager;
    }

    //当一个新当browser打开后，注册该browserID，以存储page
    pageInBrowser(browserContextId){
        if (!this.browserForPageMap.has(browserContextId)){
            this.browserForPageMap.set(browserContextId, new PageSave());
        }
    }

    //销毁browserContext的所有页面
    async destroyBrowser(browserContextId){
        if (this.browserForPageMap.has(browserContextId)){
            logger.info('pageManager => 关闭browser所属Page, browser Id: ' + browserContextId);
            const pageSave = this.browserForPageMap.get(browserContextId);
            const map = pageSave.getAllPage();
            for (const [key, value] in map) {
                await value.close({type: Events.Page.AutonomousCloseBrowser, reason: 'browser销毁'});
                //移除关闭的pageContext
                pageSave.removePage(value.Id());
            }
            this.browserForPageMap.delete(browserContextId);
        }
    }

    //开启一个页面
    async openLivePage(url, name = '', browserContextId = ''){
        let browserContext = await this.getBrowserManager().getBrowserOne(browserContextId);
        browserContextId = browserContext.Id();
        if (browserContext !== undefined && browserContext !==  null){
            const pageSave = this.browserForPageMap.get(browserContextId);
            if (!pageSave.isCache(name)){
                const pageContext = await browserContext.openPage();
                if (name !== '' && name !== undefined){
                    pageContext.renameId(name);
                }
                logger.info('pageManager => 创建新页面, pageId: '+pageContext.Id()+', browserId: '+browserContext.Id());
                await pageContext.loadUrl(url);
                pageContext.on(Events.Page.Close, (event)=>{
                    this.closed(event);
                });
                pageContext.on(Events.Page.Error, (event)=>{
                    this.pageCollapse(event);
                });
                pageContext.on(Events.Page.PageError, (event)=>{
                    this.pageError(event);
                });
                pageContext.on(Events.Page.Load, (event)=>{
                    this.loadOver(event);
                })
                pageSave.savePage(pageContext.Id(),  pageContext);
                const openNum = pageSave.getPageSize();
                browserContext.setOpenNum(openNum);
                return pageContext;
            }else {
                this.emit(Events.Page.ReNameAlready, {id: name, url: url, browserContextId: browserContextId});
            }
        }else {
            logger.error('pageManager => page创建失败, 不存在该browser, pageId:'+name+', url: '+url+', browserId: ' + browserContextId);
            this.emit(Events.Page.AttachBrowser, {id: name, url: url, browserContextId: browserContextId});
        }
    }

    closePage(browserContextId, name, reason){
        if (this.browserForPageMap.has(browserContextId)){
            const pageContext = this.browserForPageMap.get(browserContextId).getPage(name);
            if (pageContext !== null){
                logger.info('pageManager => 关闭page, pageId: ' + name);
                pageContext.close({type:Events.Page.Close, reason: reason});
            }
        }
    }

    closed(event){
        //移除对pageContext的监听
        this.removePageListener(event.loadPage);
        const pageContext = event.loadPage;
        const browserContext = pageContext.getBrowserContext();
        const pageSave = this.browserForPageMap.get(browserContext.Id());
        if (pageSave !== undefined){
            //移除关闭的pageContext
            pageSave.removePage(pageContext.Id());
            const openNum = pageSave.getPageSize();
            browserContext.setOpenNum(openNum);
        }
        this.emit(Events.Page.PageListener, {...event, browserContextId: event.loadPage.getBrowserContext().Id(), target: Events.Page.Close})
    }

    pageCollapse(event){
        //关闭页面
        event.loadPage.close({type: Events.Page.Error, reason: '页面崩溃'});
        this.emit(Events.Page.PageListener, {...event, browserContextId: event.loadPage.getBrowserContext().Id(), target: Events.Page.Error})
    }

    pageError(event){
        // event.loadPage.close({type: Events.Page.PageError, reason: event.error});
        logger.info('pageManager => 页面错误, pageId:' + event.id + ', url: ' + event.url + ',错误信息:'+event.error);
        this.emit(Events.Page.PageListener, {...event, browserContextId: event.loadPage.getBrowserContext().Id(), target: Events.Page.PageError})
    }

    loadOver(event){
        logger.info('pageManager => 缓存直播页面, pageId:' + event.id + ', url: ' + event.url);
        const pageContext = event.loadPage;
        const pageSave = this.browserForPageMap.get(pageContext.getBrowserContext().Id());
        pageSave.savePage(pageContext.Id(), pageContext);
        logger.info('pageManager => 缓存完毕, pageId:' + event.id + ', url: ' + event.url);
        this.emit(Events.Page.PageListener, {...event, browserContextId: event.loadPage.getBrowserContext().Id(), target: Events.Page.Load})
    }

    //移除监听
    removePageListener(pageContext){
        pageContext.removeAllListeners();
    }

    getPageContext(browserContextId, pageId){
        const pageSave = this.browserForPageMap.get(browserContextId);
        if (pageSave){
            const pageContext = pageSave.getPage(pageId);
            if (pageContext){
                return pageContext;
            }else {
                throw Error('在browserId: '+browserId+'的browser中未找到pageId: '+ pageId);
            }
        }else {
            throw Error('未找到browserId: '+browserId+'对应的browser');
        }
    }

    getPageContextForBrowserId(browserContextId){
        const pageSave = this.browserForPageMap.get(browserContextId);
        if (pageSave){
            return pageSave.getAllPage();
        }else {
            throw Error('未找到browserId: '+browserId+'对应的browser');
        }
    }

}

class PageSave{

    constructor(){
        const map = new Map();
        this.pageMap = map;
    }

    //保存一个PageContext
    savePage(id, pageContext){
        this.pageMap.set(id, pageContext);
    }

    removePage(id){
        if (this.pageMap.has(id)){
            this.pageMap.delete(id);
        }
    }

    isCache(id){
        return this.pageMap.has(id);
    }

    //获取一个PageContext
    getPage(id){
        if (this.pageMap.has(id)){
            return this.pageMap.get(id);
        }else {
            return null;
        }
    }

    //获取所有PageContext
    getAllPage(){
        const map = new Map();
        for (const key of this.pageMap.keys()) {
            map.set(key, this.pageMap.get(key));
        }
        return map;
    }

    //获取当前PageContext个数
    getPageSize(){
        return this.pageMap.size;
    }

}

const pageManager = new PageManager();
module.exports = pageManager;