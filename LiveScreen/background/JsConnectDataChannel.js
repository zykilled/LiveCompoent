function JsConnectDataChannel() {
    var that = this;
    this.saveMapPortToChannel = new Map();
    this.saveMapNameToPort = new Map();
    this.saveMapChannelToPort = new Map();
    //接收来自content_script转发的Js传过来的数据
    this.receive = function (msg) {
        var id = Event.connectHead+"-"+msg.Request.Data.id;
        var port = that.saveMapNameToPort.get(id);
        if (port && port != null){
            var dataChannel = that.saveMapPortToChannel.get(port);
            if (dataChannel && dataChannel != null){
                if (msg.Request.type === Event.close){
                    that.close(port);
                }else if (msg.Request.type === Event.connect){
                    const response = buildResponse(Event.connect, msg.Request, msg.Request.target, Event.success, '连接成功')
                    that.sendMessage(dataChannel, response);
                } else{
                    dataChannel.receive(msg, msg.source);
                }
            }
        }
    }
    this.close = function (port) {
        var dataChannel = that.saveMapPortToChannel.get(port);
        var port = that.saveMapChannelToPort.get(dataChannel);
        if (dataChannel && dataChannel !== null){
            dataChannel.closeChannel();
        }
        that.saveMapChannelToPort.delete(dataChannel);
        that.saveMapPortToChannel.delete(port);
        that.saveMapNameToPort.delete(port.name);
        port.disconnect();
        port = null;
    }

    this.sendMessage = function (dataChannel, msg) {
        var port = that.saveMapChannelToPort.get(dataChannel);
        if (port && port !== null){
            port.postMessage(msg);
        }
    }
    this.createDataChannel = function (port) {
        var dataChannel = dataChannelManager.createDataChannel(that, port.name);
        that.saveMapPortToChannel.set(port, dataChannel);
        that.saveMapNameToPort.set(port.name, port);
        that.saveMapChannelToPort.set(dataChannel, port);
        port.onMessage.addListener(that.receive);
    }

};
function getId() {
    const extensionId = chrome.runtime.id;
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.message === 'extensionId')
                sendResponse({message: extensionId});
        });
}
getId();

var jsDataChannel = new JsConnectDataChannel();
chrome.runtime.onConnect.addListener(function(port) {
    var id = port.name;
    if (id.indexOf(Event.connectHead) != -1){
        jsDataChannel.createDataChannel(port);
    }
});