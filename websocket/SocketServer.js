const WebSocketServer = require('ws').Server;
const args = require('../config');
const FFmpegHandler = require('../ffmpeg/FFmpegHandler');

class SocketServer {

    constructor() {
        const wss = new WebSocketServer({port: args.wsPort});
        this.map = new Map();
        const that = this;
        wss.on('connection', (ws) => {
            that.newOpen(ws);
        });
    }

    readyNewOpen(id, liveOption){
        this.map.set(id, {...liveOption, liveUrl: liveOption.liveUrl+id});
    }

    stop(id){

    }

    newOpen(ws){
        if (this.map.has(ws.protocol)){
            const liveOption = this.map.get(ws.protocol);
            this.map.delete(ws.protocol);
            const that = this;
            const ffmpegHandler = new FFmpegHandler(ws, liveOption, (ws, e) =>{
                that.close(ws, e);
            });
            this.map.set(ws.protocol, ffmpegHandler);
        }
    }

    close(ws, e){
        if (this.map.has(ws.protocol)){
            this.map.delete(ws.protocol);
        }
    }
}
const socketServer = new SocketServer();
module.exports = socketServer;