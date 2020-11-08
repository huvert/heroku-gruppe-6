const io = require("socket.io-client");

let socket = io.connect("http://192.168.1.16:4000");     // Creates websocket connection to server

socket.emit("join-room", "esp#ESP-client");  // Request to join room: website

socket.on('chat-message', (msg) => {
  console.log("Received: " + msg);
});
socket.on("data->website", (data) => {
  console.log("[data S->C] "+data);
});
socket.on("website", (data) => {
  console.log("data: ", data);
});


// TEST
socket.on('req-data', (data) => {
  // GET DATA FROM ESP HERE
  console.log("get-data --> data from esp")
  socket.emit("res-data", "4");
});

// My local ip address:   "http://192.168.1.12:4000"
