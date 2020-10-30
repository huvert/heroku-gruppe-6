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

  socket.on('disconnect', () => {
    console.log('user disconnectted');
    number_of_users -= 1;
  });

  // Messages
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', msg);
  });
});
