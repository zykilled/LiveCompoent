const puppeteer = require('puppeteer-core');
const logger = require('../log/Log');
const PageContext = require('./page/PageContext');
const EventEmitter = require('events');
const {Events} = require('../event/Events');

class BrowserContext extends EventEmitter {

    constructor(options, uuid) {
        super();
        this.options = options;
        this.uuid = uuid;
        this.openNum = 0;
    }

    async start(){
        let pluginDir = this.options.pluginDir;
        if (pluginDir === undefined || pluginDir ===  ''){
            pluginDir = './LiveScreen';
        }
        if (!this.options){
            throw new Error('config is null')
        }
        let maxView = this.options.maxView;
        if (maxView === undefined || maxView === null){
            maxView = '1920,1080';
        }
        const def = {
            headless: false,
            args: [
                '--enable-usermedia-screen-capturing',
                '--allow-http-screen-capture',
                '--auto-select-desktop-capture-source=crLive',
                '--load-extension=' + pluginDir,
                '--disable-extensions-except=' + pluginDir,
                '--disable-infobars',
                '--no-sandbox',
                '--force-device-scale-factor=1',
                '--use-fake-ui-for-media-stream',
                '--use-fake-device-for-media-stream',
                '--window-size=' + maxView,
                // '--disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies',
                '--disable-web-security',
                '--allow-file-access-from-files',
                '--disable-popup-blocking',
                // '--use-file-for-fake-video-capture=/Users/zhongyuan/develop/nodeJs/CrLiveComponent/raw3.y4m',
            ]
        }

        logger.info('browser => 正在初始化browser实例, browserId: '+this.uuid);
        const config = {...def, ...this.options};
        const uuid =  this.uuid;
        try {
            const browser = await puppeteer.launch(config);
            this.browser = browser;
            this.chromiumProcessError = false;  //判断chromium进程是否异常
            this.browserWSEndpoint = this.browser.wsEndpoint();
            this.browser.on(Events.Browser.Disconnected, ()=>{
                this.disListener();
            });
            this.emit(Events.Browser.CreateSuccess,  {id: uuid});
            return this.uuid;
        }catch (e) {
            logger.error('browser => 启动browser实例失败, browserId: '+this.uuid+', 原因:' + e.stack);
            this.emit(Events.Browser.CreateFail,  {id: uuid, error: e});
        }
    }

    disListener(){
        const uuid =  this.uuid;
        if (this.target === Events.Browser.Disconnected){
            logger.info('browser => 已经和Chromium断开连接, browserId: ' + uuid);
            this.emit(this.target,  + {id: uuid});
        }else if (this.target === Events.Browser.AutonomousClose){
            logger.info('browser => 关闭chromium, browserId: ' + uuid);
            this.emit(this.target,  {id: uuid});
            this.destroy();
        }else {
            logger.error('browser => 和Chromium连接断开，请检测Chromium进程是否正常, browserId: ' + uuid);
            this.emit(Events.Browser.ChromiumError,  {id: uuid});
            this.chromiumProcessError = true;
        }
        this.removePageListener(this.browser);
    }

    //断开与chromium连接
    async disConnect(){
        if (this.browser){
            this.target = Events.Browser.Disconnected;
            logger.info('browser => 正在尝试和Chromium断开连接, browserId: ' + this.uuid);
            // 从 Chromium 断开和 puppeteer 的连接
            await this.browser.disconnect();
            this.browser = null;

        }
    }

    async get_browser(){
        if (!this.browser){
            await this.connect();
        }
        return this.browser;
    }

    Id(){
        return this.uuid;
    }

    status(){
        if (this.chromiumProcessError){
            logger.error('browser => Chromium进程异常, browserId: ' + this.uuid);
        }
        if (this.browser){
            return true;
        }
        return false;
    }

    //开启与chromium的连接
    async connect(){
        // 从 Chromium 断开和 puppeteer 的连接
        const browserWSEndpoint = this.browserWSEndpoint;
        this.browser = await puppeteer.connect({browserWSEndpoint});
        this.browser.on(Events.Browser.Disconnected, this.disListener);
        logger.info('browser => 已和Chromium重新连接, browserId: ' + this.uuid);
    }

    //关闭chromium
    async close(){
        if (!this.browser){
            await this.connect();
        }
        this.target = Events.Browser.AutonomousClose;
        logger.info('browser => 正在关闭Chromium, browserId: ' + this.uuid);
        await this.browser.close();
    }

    destroy(){
        this.browser = null;
        this.chromiumProcessError = null;
        this.browserWSEndpoint = null;
    }

    //新增一个页面
    async openPage(){
        if (this.chromiumProcessError){
            logger.error('browser => Chromium进程异常, browserId: ' + this.uuid);
        }
        if (!this.browser){
            logger.info('browser => 和Chromium连接断开，正在尝试重新连接, browserId: ' + this.uuid);
            await this.connect();
        }
        const page = await this.browser.newPage();
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.options.liveDownLoadDir
        });
        await page.setBypassCSP(true);
        await page.setDefaultNavigationTimeout(10000);
        const pageContext  = new PageContext(page, this);
        return pageContext;
    }

    //设置当前打开网页个数
    setOpenNum(openNum){
        this.openNum = openNum;
    }

    getOpenNum(){
        return this.openNum;
    }

    //移除监听
    removePageListener(browser){
        if (browser !== undefined && browser !== null){
            browser.removeAllListeners();
        }
    }

}

module.exports = BrowserContext;