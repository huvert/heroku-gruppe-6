const HOST = "http://192.168.1.12:4000"
const maxDataTableSize = 20; // How many readings the website should hold.
var indexCounter = 0; // Used to keep track on which index to delete from table.

var clients = [];     // Stores clients

var dataTable = [
  { date: 'test1', time: 'test2', reading: 'test3' },   // DELETE
  { date: 'test', time: 'test', reading: 'test' },      // DELETE     Access last index of reading by: dataTable[dataTable.length-1].reading
];         // Stores data log


/* ==   Global Functions  == */
loadTable(dataTable);
function loadTable(dataTable) {     // Edit this function to request table from server (FIREBASE). This would be the ENITRE TABLE.
  let dataHtml = '';
  for(let data of dataTable) {
    indexCounter = indexCounter+1;
    dataHtml += (`<tr id="index${indexCounter}">
                      <td>${data.date}</td>
                      <td>${data.time}</td>
                      <td>${data.reading}</td></tr>`);
  }
  $("#data-log-table").html(dataHtml);
}

/* data should come in format: "int#str#str#str ..." */
function handleData(data) {
  cnt = data.split("#");
  cnt[0] = parseInt(cnt[0]);
  return cnt;
}

function handleLevelSensorData(data) {
  // input format:      [int, "day", "month", "year", "clock"]
  // Convert to format: {date: "", time: "", reading: int}
  //    1. Formats data
  //    2. Updates logg
  //    3. Updates linechart
  let formatedData = {date: `${data[3]}/${data[2]}/${data[1]}`, time: `${data[4]}`, reading: data[0]};
  let dataHtml = (`<tr><td>${formatedData.date}</td><td>${formatedData.time}</td><td>${formatedData.reading}</td></tr>`);
  $("#data-log-table").append(dataHtml);
  prev_data_reading = parseInt(data[0]);
  dataTable.push(formatedData);
  replaceLastDataLineChart(prev_data_reading);     // Update linechart
  indexCounter = indexCounter+1;
  if(maxDataTableSize < dataTable.length) {   // Remove first element of object and table.
    $("#data-log-table tr:first-child").remove();
    $(`#index${indexCounter-maxDataTableSize}`).remove();
  }
}






// ====================================
// ===          Socket IO           ===
$(function() {          // Waits for document to fully load before executing any JS code
  var socket = io.connect();
  socket.emit("join-room", "website");  // Request to join room: website
  socket.emit("req-client-list", "");   // require full list of "esp" clients connected to server
  socket.on("res-client-list", (clients_list) => {
    clients = JSON.parse(clients_list);
    console.log(clients);
    updateClientLogTable();
  });

  $('#command-form').submit(function(e) {
    e.preventDefault();                             // prevents page reloading
    socket.emit('chat-message', $('#command-input').val());
    $('#command-input').val('');
    return false;
  });

  $("#nav-data").on("click", function() {
    console.log("req-scater-plot");
    socket.emit('req-scatter-plot');
  });

  socket.on('res-scatter-plot', (data) => {
    console.log("res-scatter-plot");
    $('#scatterplot').html(data);
  });

  socket.on("data->website", (data) => {     // data comes in format: "måling#day#month#year#clock"
    console.log("received data from server");
    let cnt = handleData(data);  // returns list: ["måling","day","month","year","clock"]
    handleLevelSensorData(cnt);
  });


  // --   Functions for KLIENTER table on front page   --
  // These functions needs to be inside the websocket to function properly.

  // Full update of client-log-table on front page
  function updateClientLogTable() {
    $("#client-log-table").html("");
    let dataHtml = '';
    let len = clients.length;
    for (let i=0; i<len; ++i) {
      let client = clients[i];
      dataHtml = `${dataHtml}<tr><td>${client.clientName}</td></tr>`;
    }
    $("#client-log-table").html(dataHtml);
    makeTableElementsClickable();
  }

  function makeTableElementsClickable() {
    var tds = document.querySelectorAll('#client-log-table tr td');
    tds.forEach(function(td){
      td.addEventListener('click', handleTDClick);
    });
  };

  function handleTDClick() {
    console.log($(this).html());
    let client_name = $(this).html()
    socket.emit("req-data-full", client_name);
  };
});
