const Event = {

    Request: {
        type: {
            connect: 'connect',
            close: 'close',
            start: 'start',
            stop: 'stop',
            pause: 'pause',
            resume: 'resume',
        },
        Data: {
            id: 'id',
            liveType: 'liveType',
            name: 'name',
            socketPort: 'socketPort',
            connectId: 'connectId'
        },
        target: 'target',
    },

    Response: {
        type: {
            connect: 'connect',
            close: 'close',
            start: 'start',
            stop: 'stop',
            pause: 'pause',
            resume: 'resume',
            videoData: 'videoData'
        },
        target: 'target',
        result: {
            success: 'success',
            fail: 'fail',
        },
        msg: 'msg',
        request: 'request',
    },
    connectHead: 'CrLiveConnect',

    connect: 'connect',
    close: 'close',
    start: 'start',
    stop: 'stop',
    pause: 'pause',
    resume: 'resume',
    videoData: 'videoData',
    success: 'success',
    fail: 'fail',

}

function buildResponse(type, request, target, result = Event.Response.result.success, msg ='') {
    const response = {

        Response: {
            type: type,
            target: target,
            result: result,
            msg: msg,
            request: request
        }
    }
    return response;
}