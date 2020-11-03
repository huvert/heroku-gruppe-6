/*
We first import http. socket.io (which will be our websocket,) is built upon http.
The server will do as follows:
1.  Use http to send .HTML, .css and .js to Webserver.
2.  Request to open a websocket connection between browser and server.
    Later communication between server and brower will be sent using websocket (socket.io)

BTW the code may be overkill commented. Will fix this as a last finish.
*/
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);

const port = 4000;
var number_of_users = 0;
var available_rooms = ["website", "esp"];


// == Setting up server ==
app.use(express.static(__dirname + '/public/'));                   // Tells express where to look for files (such as stylesheets)
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.get('/', (req, res) => {
  res.sendFile("index.html");
});

http.listen(port || 3000, () => {
  console.log('Listening on port: ' + port);
});


// == Websockets ==
io.on("connection", (socket) => {
  number_of_users += 1;
  console.log('a user connected. # users: ' + number_of_users);
  console.log(socket.nsp.flags);

  socket.on("join-room", (room) => {
    console.log("[JOIN ROOM]");
    console.log("[JOIN-ROOM] a client requested to join room. Room: ");
    if (available_rooms.includes(room)) {
      socket.join(room);
      console.log("Joined room: " + room);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnectted');
    number_of_users -= 1;
  });

  // Messages
  socket.on('chat-message', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit('chat-message', msg);
  });

  // Got data from ESP
  socket.on('res-data', (data) => {             // Takes the data from esp and broadcasts
    console.log('data from esp: ' + data);
    socket.in('website').emit('data->website', data);
  });

  // Scatterplot data
  socket.on('req-scatter-plot', () => {
    console.log("res-scatter-plot");
    // data = getScatterplotData(); elns :)             <-- TODO: Request scatterplotdata. This data should be in 2 lists ex: "[1,2,3]#[4,5,6]"
    socket.emit('res-scatter-plot', "data");
  });

  // FOR TESTING OF ESP
  socket.on('data->server', (data) => {
    console.log(typeof(data));
    console.log(data);
  });
});

// Request data from all ESP clients    (Not sure if this is going to be used)
setInterval(() => {
  console.log("Requested Data from client");
  io.in('esp').emit('req-data', null);
}, 10000);
