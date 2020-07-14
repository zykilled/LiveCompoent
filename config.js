const args = {
    //websocket端口
    wsPort: 16547,
    //配置chrome或者chromium地址
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
    // executablePath: '/opt/google/chrome/google-chrome',

    //配置chromium窗口大小, 该参数影响直播最大分辨率
    maxView: '1920,1080',

    //插件LiveScreen地址(一般不需要指定,如果需要把LiveScreen目录移动到其它目录，需要修改该参数)
    // pluginDir: './LiveScreen',

    //直播缓存文件的保存地址
    liveCacheFileDir: '/Users/zhongyuan/Desktop/liveCache/',
    // downloadDir: '/home/liveComponent/cacheLive/',

    //录制文件保存地址
    liveDownLoadDir: '/Users/zhongyuan/Desktop/liveCache/',
    // liveDownLoadDir: '/root/Downloads',

    //接口api端口
    httpPort: 16549,
    //主机地址
    hostname: '0.0.0.0',

    //阀值, 该值只针对开启网页时未设置browserContextId情况
    //默认值为6(经检验，jitsi一个浏览器超过6个连接，这6个连接在同一个房间，连接将超时)
    browserNumThreshold: 6,
  
  	//阀值，该值为直播缓存文件达到多少才开始直播推流
    startMaxBit: 1500000,

}
module.exports = args;