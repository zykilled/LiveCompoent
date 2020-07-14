/* global chrome, MediaRecorder, FileReader */

let recorder = null;
let filename = null;
// const ws = new WebSocket('ws://localhost:16547');
chrome.runtime.onConnect.addListener(port => {

    port.onMessage.addListener(msg => {
        console.log(msg);
        switch (msg.type) {
            case 'SET_EXPORT_PATH':
                // ws.onopen = function(){
                //
                // }
                filename = msg.filename
                break
            case 'REC_STOP':
                recorder.stop()
                break
            case 'REC_CLIENT_PLAY':
                if (recorder) {
                    return
                }
                const tab = port.sender.tab
                tab.url = msg.data.url
                // chrome.tabCapture.captureOffscreenTab('https://vc.crmeeting.cn:30447/1234', )
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                    chrome.tabs.sendMessage(tabs[0].id, {type: "open_dialog_box", msg: "hello"}, function(response) {});
                });
                chrome.desktopCapture.chooseDesktopMedia(['tab', 'audio'], streamId => {
                    // Get the stream
                    navigator.getUserMedia({
                        audio: {
                            mandatory: {
                                chromeMediaSource: 'system'
                            }
                        },
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: streamId
                            }
                        }
                    }, stream => {
                        var chunks = [];
                        recorder = new MediaRecorder(stream, {
                            videoBitsPerSecond: 5000000,
                            ignoreMutedMedia: true,
                            mimeType: 'video/webm',
                        });
                        recorder.ondataavailable = function (event) {
                            if (event.data.size > 0) {
                                chunks.push(event.data);
                                // ws.send(event.data);
                            }
                        };
                        recorder.onstop = function () {
                            var superBuffer = new Blob(chunks, {
                                type: 'video/webm'
                            });

                            var url = URL.createObjectURL(superBuffer);
                            chrome.downloads.download({
                                url: url,
                                filename: filename
                            }, () => {
                            });
                        }

                        recorder.start(1000);
                    }, error => console.log('Unable to get user media', error))
                })
                break
            default:
                console.log('Unrecognized message', msg)
        }
    })

    chrome.downloads.onChanged.addListener(function (delta) {
        if (!delta.state || (delta.state.current != 'complete')) {
            return;
        }
        try {
            port.postMessage({downloadComplete: true})
        } catch (e) {
        }
    });

})
