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
var date = new Date();
/*
  clients stores all clients connected to rooms "esp" and "website"
    structure:
      clients {esp: [{clientId: "", clientName: ""}, {...}], website: []};
      Note that esp has both ID and Name. Website has only ID.
*/
var clients = {esp: [], website: []};

// ==   Functions for collecting data   ==
function getBarData(client_id) { //           <-- TODO: Get data from firebase
  return 0
}

function getLogData(client_id) {     //           <-- TODO: Get data fom firebase
  return 0
}

function getLinechartData(client_id) { //           <-- TODO: get data from firebase
  return 0
}

// ==   Functions for keeping track of clients   ==
function createClientName(name) {
  let new_name;
  if (getClientId(name) != 0) { // Name already taken (getClientId will return 0 if no Id were found)
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
  // Check room: "website"
  if (clients.website.includes(socketId)) {
    let index = clients.website.indexOf(socketId);
    clients.website.splice(index, 1);
  }
  // Check room: "esp"
  let len = clients.esp.length;
  for (let i=0; i<len; ++i) {
    var client = clients.esp[i];
    if (client.clientId == socketId) {
      console.log(client);
      console.log(clients.esp[i]);
      clients.esp.splice(i,1);
      break;
    }
  }
}

// The following 2 functions are only used on room: "esp"
function getClientId(client_name) {
  let len = clients.esp.length;
  for (let i=0; i<len; ++i) {
    var client = clients.esp[i];
    if (client.clientName == client_name) {
      return client.clientId
    }
  }
  return 0
}

function getClientName(clientId) {
  let len = clients.esp.length;
  for (let i=0; i<len; ++i) {
    var client = clients.esp[i];
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



// ==========================================
// =======         Websockets        ========
io.sockets.on("connection", (socket) => {

  socket.on('disconnect', () => {
    let clientName = getClientName(socket.id);
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
      console.log(`[JOIN-ROOM] client ${client_name} joined room: ${room}`);
      console.log(`[LIST OF CLIENTS] ${clients}`);

      if (room === "website") {
        clients.website.push(socket.id);
      }
      // give client name
      else {
        var clientInfo = new Object();
        clientInfo.clientId = socket.id;
        clientInfo.clientName = client_name;
        clients.esp.push(clientInfo);
      }

      // Ask website to update list of CLIENTS
      socket.in('website').emit("res-client-list", JSON.stringify(clients.esp)); // update client-tables on websites.
    }
  });



  // -- Sends list of all esp clients to requester --
  socket.on("req-client-list", (_) => {
    socket.emit("res-client-list", JSON.stringify(clients.esp));
  });


  // -------------------------------------------------
  // TODO: REMOVE THIS IF NOT USED
  // Got data from ESP
  socket.on('res-data', (data) => {             // Takes the data from esp and broadcasts
    console.log('data from esp: ' + data);
    data = wrapDataWithClockAndDate(data);
    socket.in('website').emit('data->website', data);
  });
  // -------------------------------------------------


  // A client asks for data from specific client
  socket.on('req-data-full', (client_name) => {
    console.log("req-data-full");
    client_id = getClientId(client_name);

    // send log data
    // TODO: FIREBASE
    //        client_id above == socket.id of the client we want the data from.
    //        if possible: Ask firebase for data matching this client ONLY.

    // TODO: implement getLogData() function to return data from last 'x' number of indexes.
    //        The line under is written in desired format. Sending this packet works.
    //        Note the order of the timestands in the structure. This should match if possible. (highest on top)
    let logdata = getLogData();
    logdata = [{date: '2020/11/11', time: '12:34:56', reading: 8},
                {date: '2015/10/10', time: '12:34:56', reading: 10},
                {date: '2010/9/9', time: '12:34:56', reading: 24}];  // THIS WORKS
    socket.emit('res-data-log', JSON.stringify(logdata));

    // send barchart data
    // TODO: implement getBarData();
    //        Should send data in fomat: data = {x_axis: ['M',...'Today'], y_axis: [1,2,3...8]}
    //        Sorter også ukedager slik at 'Today' passer i rekken. ex: Today == Tirsdag -->  x_axis: ['Ti' ... 'S','M','Today']
    //        Grafen på nettsiden vil oppdateres hver dag kl. 00:00 og behandle data deretter.
    //        I tillegg vil søyle 'Today' oppdateres on the fly
    let barchartData = getBarData();
    barchartData = {x_axis: ['M','Ti','O','T','F','L','S','Today'],
                    y_axis: [10,9,8,7,5,6,7,4]}
    socket.emit('res-data-barchart', JSON.stringify(barchartData));

    // send linechart data
    // TODO: implement getLineChartData();
    //        Same as with getBarData - x_axis should be sorted based on current time.
    let linechartData = getLinechartData();
    linechartData = {x_axis: ['00:00','','','','01:00','','','','02:00','','','','03:00','','','','04:00',
                              '','','','05:00','','','','06:00','','','','07:00','','','','08:00','','','',
                              '09:00','','','','10:00','','','','11:00','','','','12:00','','','','13:00',
                              '','','','14:00','','','','15:00','','','','16:00','','','','17:00','','','',
                              '18:00','','','','19:00','','','','20:00','','','','21:00','','','','22:00',
                              '','','','23:00','','',''],
                    y_axis: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                              23,22,21,20,24,30,35,46,88,66,55,88,99,13,14,15,16,17,18,19,20,21,22,23,
                              0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                              0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,]}   // len: 24*4}
    socket.emit('res-data-linechart', JSON.stringify(linechartData));
  });

});



// TODO: Remove this is its not used
// Request data from all ESP clients    (Not sure if this is going to be used)
setInterval(() => {
  io.in('esp').emit('req-data', null);
}, 10000);
