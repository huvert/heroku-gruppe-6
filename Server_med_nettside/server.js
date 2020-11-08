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
var date = new Date();


// ==   Functions for collecting data   ==
function getScatterData(client_id) { //           <-- TODO: Get data from firebase
  return 0
}

function getLogData(client_id) {     //           <-- TODO: Get data fom firebase
  return 0
}

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
function updateTime() {
  date = new Date();
}

function getClock() {
  updateTime();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = hours < 10 ? '0'+hours : hours;
  minutes = minutes < 10 ? '0'+minutes : minutes;
  seconds = seconds < 10 ? '0'+seconds : seconds;
  return `${hours}:${minutes}:${seconds}`  // format: 07:02:01
}

function wrapDataWithClock(data) {
  data = data.toString();
  return `${data}#${getClock()}`
}

function wrapDataWithDate(data) {
  data = data.toString();
  let dato = date.getDate();
  let month = date.getMonth()+1;
  dato = dato < 10 ? '0'+dato : dato;
  month = month < 10 ? '0'+month : month;
  return `${data}#${dato}#${month}#${date.getYear()+1900}`
}

function wrapDataWithClockAndDate(data) {   // returns: data#day#month#year#05:20:40
  return `${wrapDataWithDate(data)}#${getClock()}`
}


// == Setting up server ==
app.use(express.static(__dirname + '/public/'));                   // Tells express where to look for files (such as stylesheets)
app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.get('/', (req, res) => {
  res.sendFile(__dirname+"/public/index.html");
});
app.get('*', (req, res) => {
  res.sendFile(__dirname+"/public/404.html");
});

http.listen(port, () => {
  console.log('Listening on port: ' + port);
});


// == Websockets ==
io.sockets.on("connection", (socket) => {


  socket.on('disconnect', () => {
    let clientName = findClientName(socket.id)
    removeClientName(clientName, socket.id);
    socket.to('website').emit("res-client-list", JSON.stringify(clients)); // update client-tables on websites.
    console.log(`[DISCONNECT] client ${clientName} disconnected`);
  });



  // -- Join room and give client name --
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
    socket.in('website').emit("res-client-list", JSON.stringify(clients)); // update client-tables on websites.
  });



  // -- Sends list of all clients to requester --
  socket.on("req-client-list", (_) => {
    socket.emit("res-client-list", JSON.stringify(clients));
  });



  // Got data from ESP
  socket.on('res-data', (data) => {             // Takes the data from esp and broadcasts
    console.log('data from esp: ' + data);
    data = wrapDataWithClockAndDate(data);
    console.log('wrapped data: ' + data);
    socket.in('website').emit('data->website', data);
  });



  // A clients asks for data from specific client
  socket.on('req-client-data-full', (client_name) => {
    console.log("req-client-data-full");
    client_id = findClientId(client_name);
    console.log(client_id);

    // send log
    let logdata = getLogData();
    socket.emit('res-client-data-full-log', JSON.stringify(logdata));
    // send scatter
    let scatterdata = getScatterData();
    socket.emit('res-client-data-full-scatter', JSON.stringify(scatterdata));
  });

});



// TODO: Remove this is its not used
// Request data from all ESP clients    (Not sure if this is going to be used)
setInterval(() => {
  let t = wrapDataWithClockAndDate("1924");
  console.log(`Requested Data from client  [${t}]`);
  io.in('esp').emit('req-data', null);
}, 10000);
