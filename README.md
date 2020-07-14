直播录制组件
承载功能:
    1、云端录制、直播
    2、方数测试

录制当前tab页面，并将blob数据上传给CrLiveComponent组件
目前已知的问题:
    静态页面。由于插件中MediaRecorder的问题，导致如果页面静止不动，ondataavailable返回的数据为0。
    目前尝试的解决方法
        1、保存最后一帧，如果数据为0，返回最后一帧(结果:不行。node的fs库不知名原因不会写入重复最后一帧数据，导致直播自动结束)
        2、植入音量极低的mp3文件(结果：可以,但是当设备音量特别大时，还是会出现声音)
        3、植入div，使其背景透明度极低，然后不停的显示隐藏(结果：可以,但是页面仔细观察还是能观察到div)
        
相关配置请查看config.js

关于已知问题的第三点，如需测试，可以打开PageContext.js中127行的注释,进行相关尝试


安装方法:
    1、复制项目到服务器
    2、配置config.js参数
    3、执行node main.js
    4、访问http://ip:{config.js中配置的httpPort}/liveComponent/{url}，url注3查看
    注1: 如果需要在服务器安装，则需要安装Xvfb，为了方便观察，可以安装X11vnc，
        安装Xvfb方法如下:
            1:sudo apt-get install xvfb
            2:Xvfb :5 -screen 0 1920x1080x24
            3:export DISPLAY=:5（这句执行了才能执行node main.js)
        安装X11vnc方法如下:
            1:sudo apt-get install x11vnc
            2:x11vnc -storepasswd(设置vnc远程密码)
            3:x11vnc -forever -shared -rfbauth ~/.vnc/passwd(各个地址不同，可以自行设置)
            4:x11vnc -display :5 -once -loop -noxdamage -repeat -rfbauth ~/.vnc/passwd 
            -rfbport 5905(设置端口) -shared  -scale 1920x1080 &
    注2: 如果出现浏览器上字体乱码,可通过安装字体库解决
            sudo apt-get install ttf-wqy-microhei ttf-wqy-zenhei xfonts-wqy
        
    注3: url值如下
    
    开启直播
    live/openLive
    参数:
        liveUrl:    直播地址
        format:     直播方式(rtmp, rtsp)
        width:      分辨率
        height:     分辨率
        fileName:   保存(缓存)文件名称
        liveType:   类型: 0:直播，1:录制，2:直播加录制
        openUrl:    需要直播的网页
        pageId:     页面Id(自定义，可选)
    返回值:
         browserId: 浏览器Id
         pageId:    页面Id
         openUrl:   需要直播的网页
         liveUrl:   直播地址
         format:    直播类型
         width:     分辨率
         height:
         fileName:  文件名称
         liveType:  类型
    
    
    //关闭直播
    live/closeLive
    参数:
        browserId: 浏览器Id
        pageId:    页面Id
    返回值:
        browserId: 浏览器Id
        pageId:    页面Id
        fileName:  文件名称(如果是录制，可以通过该值进行文件下载)
    
    //下载直播文件
    live/downLiveFile
    参数:
        fileName:   closeLive返回的fileName
    
    //开启测试
    square/startSquare
    参数:
        squareNumber:   测试方数
        openUrl:        测试网页
    
    //停止测试
    square/stopSquare
    参数:
        无
    
    //新增方数
    square/addSquare
    参数
        squareNumber:   测试方数
        openUrl:        测试网页，可选，默认为startSquare时的openUrl
    
    //删除方数
    square/delSquare
    参数:
        squareNumber:   关闭方数
    
    
关闭说明: 由于目前没有写相关脚本，关闭步骤如下
    1、lsof -i:{config.js中配置的httpPort}, kill -9 进程号
    2、ps -ef|grep google-chrome, kill -9 进程号
    注: 第二步是为了关闭chrome浏览器，可以通过x11vnc进行关闭，chrome在测试过程中请一定注意关闭
    ，避免开启过多导致内存问题
    
特别说明:
    由于在开发中，测试到一个浏览器jitsi最多可以加入6方，当加入7方时会出错。所以在config.js特别设置了
    browserNumThreshold，参数。为了避免在测试时，导致浏览器开启过多导致业务出问题，建议不要在线上进行
    方数测试。
    
   
    