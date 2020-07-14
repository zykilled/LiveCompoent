
function RecordManager() {
    var that = this;
    this.createRecord = function (liveType, callback) {
        var record = new Record(liveType, callback);
        return record;
    }

};
function Record(liveType, callback) {
    var that = this;
    this.callback = callback;
    this.liveType = liveType;
    var chunks = [];
    that.chunks = chunks;
    this.getStream = function (name) {
        that.filename = name;
        //测试使用
        // var xhr = new XMLHttpRequest();
        // xhr.open("get", 'https://b-ssl.duitang.com/uploads/item/201710/16/20171016112909_Rzuym.thumb.224_0.gif', true);
        // xhr.responseType = "blob";
        // xhr.onload = function() {
        //     if (this.status == 200) {
        //         that.blob = this.response;
        //     }
        // };
        // xhr.send();
        var pending_request_id = chrome.desktopCapture.chooseDesktopMedia(['tab', 'audio'] , null, streamId => {
            if (streamId !== ''){
                navigator.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'system',
                            chromeMediaSourceId: streamId
                        }
                    },
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: streamId
                        }
                    }
                }, stream => {
                    const recorderLive = new MediaRecorder(stream, {
                        audioBitsPerSecond: 128000,
                        videoBitsPerSecond: 3500000,
                        ignoreMutedMedia: true,
                        mimeType: 'video/webm',
                    });
                    recorderLive.ondataavailable = that.ondataavailable;
                    recorderLive.onstop = that.recorderStop;
                    that.recorderLive = recorderLive;
                    that.start();

                }, error => console.log('Unable to get user media', error))
            }
        });
        that.pending_request_id = pending_request_id;
    }

    this.start = function () {
        if (that.recorderLive != undefined && that.recorderLive != null){
            that.recorderLive.start(1000);
            that.status = 'start';
        }
    };
    this.stop = async function () {
        if (that.recorderLive != undefined && that.recorderLive != null){
            const promise = new Promise((resolve, reject)=>{
                that.resolve = resolve;
            });
            that.recorderLive.stop();
            that.recorderLive = null;
            that.recorderPause = null;
            that.status = 'stop'
            chrome.desktopCapture.cancelChooseDesktopMedia(that.pending_request_id);
            return promise;
        }else {
            return new Promise((resolve, reject)=>{
                resolve({msg: ''});
            });
        }
    };
    this.pause = function () {
        if (that.recorderLive != undefined && that.recorderLive != null && that.status == 'start'){
            that.status = 'pause';
            that.recorderLive.pause();
        }
    };
    this.resume = function () {
        if (that.recorderLive != undefined && that.recorderLive != null && that.status == 'pause'){
            that.status = 'start';
            that.recorderLive.resume();
        }
    };
    this.ondataavailable = function (event) {
        if (event.data.size > 0) {
            that.lastData = event.data;
            that.chunks.push(event.data);
            if ((that.liveType == 0 || that.liveType == 2) && that.callback){
                if (that.status === 'start'){
                    that.callback(event.data);
                }
            }
        }else {
            // that.chunks.push(that.lastData);
            // if ((that.liveType == 0 || that.liveType == 2) && that.callback){
            //     if (that.status === 'start'){
            //         var blob = new Blob([that.lastData], {
            //             type: 'video/webm'
            //         });
            //         that.callback(blob);
            //     }
            // }
        }
    };
    this.startPause = function () {
        that.interval = setInterval(function () {
            that.callback(that.blob);
        }, 1000);
    };
    this.stopPause =  function () {
        clearInterval(that.interval);
    };
    this.recorderStop = function () {
        if (that.liveType == 2 || that.liveType == 1){
            var superBuffer = new Blob(that.chunks, {
                type: 'video/webm;'
            });
            var url = URL.createObjectURL(superBuffer);
            //将生成的url发送给node
            that.resolve({msg: url});
            that.chunks = [];
        }else {
            that.resolve({msg: ""});
        }
    };
    this.dataCallBack = function (callback) {
        that.callback = callback;
    };
    this.destroy = function () {
        that.status = 'destroy';
        that.callback = null;
        that.recorderLive = null;
        // that.recorderPause = null;
    }
};
var recordManager = new RecordManager();
