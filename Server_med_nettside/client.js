const io = require("socket.io-client");

let socket = io.connect("http://82.164.163.64:22");     // Creates websocket connection to server


socket.on('chat message', (msg) => {
  console.log("Received: " + msg);
});


// My local ip address:   "http://192.168.1.12:4000"
