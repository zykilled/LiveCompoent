//读取基础配置操作
const args = require('./config');
const browserManager =  require('./chromium/BrowserManager');
const Sleep = require('./utils/Sleep');
const uuid = require('node-uuid');
async function test(){

        this.pageManager = await browserManager.init(args);
        for (let one = 0; one < 8; one++){
            // await Sleep.sleep(6000);
            // const pageContext = await this.pageManager.openLivePage('https://iptv.crmeeting.cn/joinTest.html?roomId=889537387&nickName=dd&password=123&isShare=false&notShowVideo=false',
            //     '', '');
            const pageContext = await this.pageManager.openLivePage('https://www.baidu.com',
                '', '');
            // await pageContext.startLive({
            //     //直播地址
            //     liveUrl: 'rtmp://stream-push.crmeeting.cn/test/',
            //     //直播类型(rtmp,rtsp)
            //     format: 'rtmp',
            //     //直播分辨率
            //     width: 1200,
            //     height: 720,
            //     //文件名称
            //     fileName: '1234',
            //     //直播类型:-1:方数测试,0:直播，1：录制，2：直播与录制
            //     liveType: 1
            // });
        }

}
test();
