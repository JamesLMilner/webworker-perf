onmessage = function(message) {
    message.data.now = Date.now();
    postMessage(message.data);
}