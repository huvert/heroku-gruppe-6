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
var available_rooms = ["website", "esp"];
var clients = [];       // Connected clients
var current_time = new Date();


// ==   Functions for keeping track of clients   ==
function createClientName(name) {
  let new_name;
  if (findClientId(name) != 0) { // Name already taken (findClientId will return 0 if no Id were found)
    new_name = createClientName(`${name}*`);    // Same name but with a * to identify its a copy (this will loop untill a name is found.)
    return new_name
  }
  else if (name != null) { // Name specified and not taken
    new_name = name;
    return new_name
  }
  else {  // no name specified
    new_name = createClientName("Unnamed Client");
    return new_name;
  }
}

function removeClientName(name, socketId) {
  let len = clients.length;
  for (let i=0; i<len; ++i) {
    var client = clients[i];
    if (client.clientId == socketId) {
      clients.splice(i,1);
      break;
    }
  }
}

function findClientId(client_name) {
  let len = clients.length;
  for (let i=0; i<len; ++i) {
    var client = clients[i];
    if (client.clientName == client_name) {
      return client.clientId
    }
  }
  return 0
}

function findClientName(clientId) {
  let len = clients.length;
  for (let i=0; i<len; ++i) {
    var client = clients[i];
    if (client.clientId == clientId) {
      return client.clientName
    }
  }
  return 0
}


// ==       Time        ==
function getClock() {
  return `${current_time.getHours()}:${current_time.getMinutes()}:${current_time.getSeconds()}`
}

function wrapDataWithClock(data) {
  data = data.toString();
  return `${data}#${getClock()}`
}

function wrapDataWithDate(data) {
  data = data.toString();
  return `${data}#${current_time.getDate()}#${current_time.getMonth()}#${current_time.getYear()}`
}

function wrapDataWithClockAndDate(data) {   // returns: data#day#month#year#05:20:40
  return `${wrapDataWithDate(data)}#${getClock()}`
}


// == Setting up server ==
app.use(express.static(__dirname + '/public/'));                   // Tells express where to look for files (such as stylesheets)
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.get('/', (req, res) => {
  res.sendFile("index.html");
});

http.listen(port, () => {
  console.log('Listening on port: ' + port);
});


// == Websockets ==
io.sockets.on("connection", (socket) => {

  socket.on("join-room", (data) => {  // data in format: "room_name#client_name"
    data = data.split("#");
    let client_name = createClientName(data[1]);
    let room = data[0];

    // Join Room
    if (available_rooms.includes(room)) {
      socket.join(room);
      console.log("Joined room: " + room);
    }

    // give client name
    if (room !== "website") {
      var clientInfo = new Object();
      clientInfo.clientId = socket.id;
      clientInfo.clientName = client_name;
      clients.push(clientInfo);
    }
    console.log(`[JOIN-ROOM] client ${client_name} joined room: ${room}`);
    console.log(`[LIST OF CLIENTS] ${clients}`);

    // Ask website to update list of CLIENTS
    socket.to('website').emit("res-client-list", JSON.stringify(clients)); // update client-tables on websites.
  });

  socket.on('disconnect', () => {
    let clientName = findClientName(socket.id)
    removeClientName(clientName, socket.id);
    socket.to('website').emit("res-client-list", JSON.stringify(clients)); // update client-tables on websites.
    console.log(`[DISCONNECT] client ${clientName} disconnected`);
  });

  // Sends list of all clients to requester
  socket.on("req-client-list", (_) => {
    socket.emit("res-client-list", JSON.stringify(clients));
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
  let t = wrapDataWithClockAndDate("1924");
  console.log(`Requested Data from client  [${t}]`);
  io.in('esp').emit('req-data', null);
}, 10000);
