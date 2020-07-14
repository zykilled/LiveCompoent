function DataChannelManager(){
    var that = this;
    this.createDataChannel = function (connect, id) {
        var dataChannel = new DataChannel(connect, id);
        return dataChannel;
    }
}
var dataChannelManager = new DataChannelManager();