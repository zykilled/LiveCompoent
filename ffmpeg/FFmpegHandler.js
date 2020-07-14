const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const args = require('../config');
const logger = require('../log/Log');
class FFmpegHandler{

    constructor(ws, liveOption, closeCallback) {
        this.ws = ws;
        this.startTime = new Date();
        this.liveOption = liveOption;
        const that = this;
        this.closeCallback = closeCallback;
        ws.on('message', (msg) => {
            that.message(msg);
        });
        ws.on('close', (e) => {
            that.close(ws, e);
        });
        this.ffmpeg(liveOption.liveUrl);
    }

    message(msg){
        if (this.fileStreamLive.writable){
            this.fileStreamLive.write(msg);
            this.length += msg.length;
            if (!this.isStart && this.length>args.startMaxBit){
                this.isStart = true;
                this.commandLive.run();
                // this.commandLive.write(msg);
                this.length = 0;
            }
        };
    }

    ffmpeg(liveUrl){
        const fileSaveDir = args.liveCacheFileDir;
        const format = this.liveOption.format === 'rtsp'?'rtsp':'flv';
        if (!fs.existsSync(fileSaveDir)){
            fs.mkdirSync(fileSaveDir);
        }
        const fileDir =  fileSaveDir+this.liveOption.fileName+'.mp4';
        const fileStream = fs.createWriteStream(fileDir);
        const that = this;
        const command = ffmpeg(fileDir)
            .inputOptions('-re')
            // .inputOption('-stream_loop 1')
            .format(format)
            .on('start', function (commandLine) {
                logger.info('ffmpeg => startLive, pageId: '+that.liveOption.pageId+
                    ', liveType: '+that.liveOption.liveType+', liveUrl: '+liveUrl+
                    ', file: ' + fileDir+', Date: '+ new Date()+', ffmpegCommand: '+ commandLine);
            })
            .on('error', function (err, stdout, stderr) {
                logger.info('ffmpeg => errorLive, pageId: '+that.liveOption.pageId+
                    ', liveType: '+that.liveOption.liveType+', liveUrl: '+liveUrl+
                    ', file: ' + fileDir+', Date: '+ new Date()+', error: '+ err);
                fs.unlinkSync(fileDir);
            })
            .on('end', function () {

                if (that.startTime === undefined){
                    logger.info('ffmpeg => endLive, pageId: '+that.liveOption.pageId+
                        ', liveType: '+that.liveOption.liveType+', liveUrl: '+liveUrl+
                        ', file: ' + fileDir+', Date: '+ new Date());
                    fs.unlinkSync(fileDir);
                    command.kill();
                }else{
                    logger.info('ffmpeg => endLive重新开始直播, pageId: '+that.liveOption.pageId+
                        ', liveType: '+that.liveOption.liveType+', liveUrl: '+liveUrl+
                        ', file: ' + fileDir+', Date: '+ new Date());
                    command.run();
                }


            });
        if (this.liveOption.width == undefined || this.liveOption.height == undefined){
            command.videoCodec("copy")
        }else {
            const widthNumber = this.liveOption.width * 1;
            const heightNumber = this.liveOption.height * 1;
            if (typeof widthNumber === 'number' && widthNumber %  1 === 0
                && typeof heightNumber === 'number' && heightNumber %  1 === 0){
                command.videoCodec('libx264');
                command.size(this.liveOption.width+'x'+this.liveOption.height);
                command.audioCodec('aac');
            }else {
                command.videoCodec("copy");
                command.audioCodec('aac');
            }
        }
        command.output(liveUrl, {
            end: true
        });
        this.isStart = false;
        this.length = 0;
        this.fileStreamLive = fileStream;
        this.commandLive = command;
    }



    close(ws, e){
        this.startTime = undefined;
        this.fileStreamLive.destroy();
        this.closeCallback(ws, e);
        this.closeCallback = null;
    }

}
module.exports = FFmpegHandler;