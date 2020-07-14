//数据连接通道(用于连接websocket或者JsDataChannel消息数据)
function DataChannel(connect, id) {
    this.connect = connect;
    this.id = id;
    var that = this;
    //接收数据通道
    this.receive = async function (message) {
        if (message.Request.type === Event.start){
            const port = message.Request.Data.socketPort;
            const liveType = message.Request.Data.liveType;
            if (port && (liveType === 0 || liveType === 2)){
                const ws = new WebSocket('ws://127.0.0.1:' + port, id);
                that.ws = ws;
                ws.onopen = function(){
                    that.initStart(message);
                }
            }else {
                that.initStart(message);
            }
        }
        if (message.Request.type === Event.stop){
            const msg = await that.record.stop();
            if (that.ws !== null && that.ws !== undefined){
                that.ws.close();
                that.ws = null;
            }
            const response = buildResponse(Event.stop, message.Request,
                message.Request.target, Event.success, msg);
            that.sendMessage(response);
        }
        if (message.Request.type === Event.pause){
            that.record.pause();
            const response = buildResponse(Event.pause, message.Request,
                message.Request.target, Event.success, '暂停录制');
            that.sendMessage(response);
        }
        if (message.Request.type === Event.resume){
            that.record.resume();
            const response = buildResponse(Event.resume, message.Request,
                message.Request.target, Event.success, '重新开始录制');
            that.sendMessage(response);
        }
    };
    this.initStart = function (message) {
        var liveType = message.Request.Data.liveType;
        var record = recordManager.createRecord(liveType, that.videoDataCallBack);
        that.record = record;
        that.record.dataCallBack(that.videoDataCallBack);
        that.record.getStream(message.Request.Data.name);
        const response = buildResponse(Event.start, message.Request,
            message.Request.target, Event.success, '开始录制');
        that.sendMessage(response);
    }
    this.videoDataCallBack = async function (data) {
        if (that.ws){
            that.ws.send(data);
        }
    };

    //向通道发送数据
    this.sendMessage = function (message) {
        //向websocket或者JsDataChannel发送数据
        if (that.connect && that.connect != null){
            that.connect.sendMessage(that, message);
        }
    }

    //关闭通道
    this.closeChannel = function () {
        that.record  = null;
        that.connect = undefined;
    }
}