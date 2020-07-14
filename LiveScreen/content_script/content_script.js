let port  = null;
let extensionId = null;
window.onload = () => {
    if (window.recorderInjected) return
    Object.defineProperty(window, 'recorderInjected', {value: true, writable: false})

    window.addEventListener('message', event => {
        if (event.data.Request){
            if (port !== null){
                try {
                    document.title = 'crLive';
                    port.postMessage(event.data);
                }catch (e) {
                    port = null;
                }
            }
            if (event.data.Request.type === 'connect'){
                document.title = 'crLive';
                var id = event.data.Request.Data.id;
                // var extensionId =  event.data.Request.Data.connectId;
                if (id && id !== null){
                    port = chrome.runtime.connect(extensionId, {name: Event.connectHead+"-"+id});
                    port.onMessage.addListener((msg)=>{
                        if (msg){
                            window.postMessage(msg, '*');
                        }
                    });
                    port.postMessage(event.data);
                }else {
                    const response = buildResponse(Event.connect, event.data.Request,
                        event.data.Request.target, Event.fail, '连接id不能为null');
                    window.postMessage(response, '*');
                }
            }
            if (event.data.Request.type === 'square'){
                document.title = 'crLive';
                window.postMessage(event.data, '*');
            }
        }
    });
    chrome.runtime.sendMessage({message: 'extensionId'}, function(response) {
        extensionId = response.message;
    });
};