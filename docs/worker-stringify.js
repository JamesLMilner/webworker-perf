onmessage = function(message) {
    message.data.data = JSON.parse(message.data.data);
    message.data.data = JSON.stringify(message.data.data)
    message.data.now = Date.now();
    postMessage(message.data);
}