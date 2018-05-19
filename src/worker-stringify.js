onmessage = function(message) {
    message.data = JSON.parse(message.data.data)
    message.data.now = Date.now();
    postMessage(message.data);
}