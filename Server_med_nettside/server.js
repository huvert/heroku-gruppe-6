"use strict";

const maxDataTableSize = 7;

/*
We first import http. socket.io (which will be our websocket,) is built upon http.
The server will do as follows:
1.  Use http to send .HTML, .css and .js to Webserver.
2.  Request to open a websocket connection between browser and server.
    Later communication between server and brower will be sent using websocket (socket.io)

BTW the code may be overkill commented. Will fix this as a last finish.
*/
var firebase = require('firebase');
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require('socket.io')(http);

const port = 4000;
var available_rooms = ["website", "esp"];
var date = new Date();
var barchart_container = [];
var linechart_container = [];
var c = 0;
/*
  clients stores all clients connected to rooms "esp" and "website"
    structure:
      clients {esp: [{clientId: "", clientName: ""}, {...}], website: []};
      Note that esp has both ID and Name. Website has only ID.
*/
var clients = {esp: [], website: []};



function pushAndShift(list) {
  list.push(list[0]);
  list.shift();
  return list
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

function getDate(days_from_today=0) {
  updateTime();
  return `${date.getYear()+1900}-${date.getMonth()+1}-${date.getDate()-days_from_today}`
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

function getListOfWeekdays() {
  updateTime();
  let weekdays = ['M','Ti','O','T','F','L','S'];    // 'Today'
  let weekday = date.getDay();
  for (let i=1; i<weekday; i++) {
    weekdays.push(weekdays[0]);
    weekdays.shift();
  }
  weekdays.push('Today');
  return weekdays
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

  // Tell specific ESP-client to start/stop Servo
  socket.on("maintenance", (state) => {
    state = state.split("#");  // [name, state]
    let id = getClientId(state[0]);
    io.to(id).emit("maintenance", state[1]);
  });

  // A client asks for data from specific client
  socket.on('req-data-full', (client_name) => {
    console.log("req-data-full");
    let client_id = getClientId(client_name);

    getLogDataFromFirebase(client_name)
      .then(container => {
        socket.emit('res-data-log', JSON.stringify(container));
      })
      .catch(error => {
        console.log('[ERROR] error when getting log data from firebase');
        console.log(error);
      });

    getBarchartDataFromFirebase(client_name)
      .then(y_axis => {
        let x_axis = getListOfWeekdays();
        let barchartData = {x_axis: x_axis, y_axis: y_axis}
        socket.emit('res-data-barchart', JSON.stringify(barchartData));
      })
      .catch((error) => {
        console.log('[ERROR] error when getting barchart data from firebase');
        console.log(error);
      })

    getLinechartDataFromFirebase(client_name)
      .then((linechartData) => {
        console.log(linechartData);
        console.log(linechartData.x_axis.length);
        console.log(linechartData.y_axis.length);
        fillLinechartData(linechartData);
        socket.emit('res-data-linechart', JSON.stringify(linechartData));
      })
      .catch((error) => {
        console.log('[ERROR] error when getting linechart data from firebase');
        console.log(error);
      })

  });

  // Got data from ESP
  socket.on('res-data', (data) => {             // Takes the data from esp and broadcasts
    let client_name = getClientName(socket.id);
    data = wrapDataWithClockAndDate(data);
    console.log(`[NEW DATA] new data from ${client_name}: ${data}`);
    writeEspData(client_name, data);
    socket.in('website').emit('data->website', data);
  });
});



// ============   FIREBASE  =============

// Your web app's Firebase configuration
var firebaseConfig = {
   apiKey: "AIzaSyDPv6NqXMvrr-mRGHIvKU9XbgzimMu_PLg",
   authDomain: "raspbarry-pi---gruppe-6.firebaseapp.com",
   databaseURL: "https://raspbarry-pi---gruppe-6.firebaseio.com",
   projectId: "raspbarry-pi---gruppe-6",
   storageBucket: "raspbarry-pi---gruppe-6.appspot.com",
   messagingSenderId: "988917312975",
   appId: "1:988917312975:web:858f19591cd6732d2bb6ba"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.database();

function writeEspData(client_name, espData) {
  var data = espData;
  var parse =data.split('#');

  db.ref('ESP32-Data/' + client_name).push({
    date: parse[3]+'-'+parse[2]+'-'+parse[1],
    time: parse[4],
    nivå: Number(parse[0]),

  });
}
//example: writeEspData("ESP 1", "50#12#11#2020#15:47")

//gets items in date range
//example: queryItemByDateRange("2019-11-12","2020-11-11")

function queryDB(){
  var ref = firebase.database().ref('ESP32-Data');
  ref.orderByChild("date").on("child_added", function(snapshot) {
    console.log('dato ' + snapshot.val().date + '. Gjenstående nivå ' + snapshot.val().nivå);
  });
}


function getLogDataFromFirebase(client_name) {
  return new Promise((res, rej) => {
    let endDate = getDate();
    let startDate = getDate(3);
    var ref = db.ref('ESP32-Data/' + client_name);
    var container = [];

    ref.orderByChild("date").startAt(startDate).endAt(endDate).on("child_added", function(snapshot) {
      container.unshift({date: snapshot.val().date, time: snapshot.val().time, reading: snapshot.val().nivå});
      res(container);
    });
  });
}

function getBarchartDataFromFirebase(client_name) {
  return new Promise((res, rej) => {
    var y_axis = [0,0,0,0,0,0,0,0];

    // Loops over 8 last days
    // 1. (in loop) Reads number of data readings per day
    // 2. (in loop) Sorts this data into y_axis list
    // 3. Place x_axis and y_axis into object and send to website.
    for (let i=0; i<8; i++) {

      let day = getDate(i);
      var promise = new Promise((res, rej) => {
        var ref = db.ref('ESP32-Data/' + client_name);
        ref.orderByChild("date").startAt(day).endAt(day).on("value", function(snapshot) {
          let number_of_readings = snapshot.numChildren();
          res(number_of_readings);
        });
      })

      promise
        .then((n) => {
          y_axis[7-i] = n;
          if (i === 7) {
            console.log(y_axis);
            res(y_axis);
          }
        })
        .catch((error) => {
          console.log('[ERROR]');
          console.log(error);
        })
      }
  });
}


function getLinechartData() {
  return new Promise((res, rej) => {
    let startDate = getDate(1);
    let endDate = getDate();

    var ref = db.ref('ESP32-Data/' + client_name);
    ref
      .orderByChild("date").startAt(startDate).endAt(endDate).on("child_added", function(snapshot) {

        res({x_axis: x_axis, y_axis: y_axis});
      });
  });
}


function getLinechartDataFromFirebase(client_name) {
  return new Promise((res, rej) => {
    let startDate = getDate(1);
    let endDate = getDate();
    console.log("===============");
    console.log(endDate);
    let clock = getClock();
    let x_axis = formatXaxis(clock);
    var y_axis = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                  0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,];

    var ref = db.ref('ESP32-Data/' + client_name);
    ref
      .orderByChild("date").startAt(startDate).endAt(endDate).on("child_added", function(snapshot) {

        // Its yesterday after start time OR today
        if ((snapshot.val().date == startDate && snapshot.val().time > clock) || snapshot.val().date === endDate) {
          let index = getIndex(snapshot.val().time, clock);
          y_axis[index] = snapshot.val().nivå;
          console.log("NIVÅ: " + snapshot.val().nivå);
          console.log(index);
        }
        res({x_axis: x_axis, y_axis: y_axis});
      });
  });
}

function getIndex(time, current_time) {
  time = time.split(":");
  current_time = current_time.split(":");
  time[0] = time[0] - current_time[0];
  time[1] = Math.floor((time[1] - current_time[1])/15);
  return 96 + time[0]*4 + time[1]
}

function formatXaxis(current_clock) { // time comes in in format: "h:min:sek"
  let clock = current_clock.split(":");
  let n = Math.floor(clock[1]/15);
  let hour = `${clock[0]}:00`
  let x_axis = ['00:00','','','','01:00','','','','02:00','','','','03:00','','','','04:00',
                '','','','05:00','','','','06:00','','','','07:00','','','','08:00','','','',
                '09:00','','','','10:00','','','','11:00','','','','12:00','','','','13:00',
                '','','','14:00','','','','15:00','','','','16:00','','','','17:00','','','',
                '18:00','','','','19:00','','','','20:00','','','','21:00','','','','22:00',
                '','','','23:00','','',''];
  // Uses for loops instead of while to prevent it from getting stuck due to
  // unforseen bugs.
  for (let i=0; i<100; i++) {
    pushAndShift(x_axis);
    if (x_axis[0] === hour) {
      for (let ii=0; ii<n+1; ii++) {
        pushAndShift(x_axis);
      }
      break;
    }
  }
  return x_axis
}

function fillLinechartData(linechartData) {
  // Find first reading
  let prev_val;
  linechartData.y_axis.forEach(data => {
    if (data !== 0 && prev_val === undefined) {
      prev_val = data;
    }
  });
  for (let i=0; i<linechartData.y_axis.length; i++) {
    if (linechartData.y_axis[i] === 0) {
      linechartData.y_axis[i] = prev_val;
    }
    else {
      prev_val = linechartData.y_axis[i];
    }
  }
}
