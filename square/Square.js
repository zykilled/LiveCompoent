const logger = require('../log/Log');
const browserManager =  require('../chromium/BrowserManager');
const {Events} = require('../event/Events');
const Sleep = require('../utils/Sleep');
class Square {

    constructor() {
        this.list = new Array();
        this.option = null;
    }

    async startSquare(option){
        if (this.option === null){
            this.option = option;
            logger.info('square => 正在开启方数测试');
            logger.info('square => 逐步开启页面, 页面url: ' + this.option.openUrl);
            logger.info('square => 开启总方数: ' + this.option.squareNumber);
            this.pageManager = await browserManager.getPageManager();
            for (let one = 0; one < this.option.squareNumber; one++){
                await Sleep.sleep(3000);
                const pageContext = await this.pageManager.openLivePage(this.option.openUrl, '', this.browserContextId);
                this.list.push(pageContext);
                logger.info('square => 开启方数: ' + (one+1));
            }
            return this.option;
        }else {
            return false;
        }
    }

    async stopSquare(){
        logger.info('square => 停止方数测试');
        this.option = null;
        this.list.splice(0, this.list.length);
        return true;
    }

    async addSquare(number, url=''){
        if (this.option !== null){
            logger.info('square => 新增测试方数: ' + number);
            const openUrl = url!==''?url:this.option.openUrl;
            for (let one = 0; one < number; one++){
                const pageContext = await this.pageManager.openLivePage(openUrl, '', this.browserContextId);
                logger.info('square => 开启方数: ' + one);
                this.list.push(pageContext);
            }
            this.option.squareNumber = this.option.squareNumber + number;
            logger.info('square => 当前总方数: ' + this.option.squareNumber);
            return this.option;
        }else {
            return false;
        }
    }

    async delSquare(number){
        if (this.option !== null){
            logger.info('square => 删除测试方数: ' + number);
            for (let one = 0; one < number; one++){
                if (this.list.length === 0){
                    logger.info('square => 当前要求删除方数大于总测试方数');
                    break;
                }
                const pageContext = this.list.pop();
                pageContext.close({type: Events.Page.AutonomousCloseBrowser, reason: '方数测试关闭'});
                logger.info('square => 删除方数: ' + (one+1));
            }
            this.option.squareNumber = this.list.length;
            logger.info('square => 剩余总方数: ' + this.option.squareNumber);
            if (this.option.squareNumber === 0){
                logger.info('square => 当前剩余方数为0，将关闭测试');
                await this.stopSquare();
            }
            return this.option
        }else {
            return false;
        }
    }

}
const square = new Square();
module.exports = square;
