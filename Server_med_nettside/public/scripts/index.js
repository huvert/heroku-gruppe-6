const HOST = "http://192.168.1.12:4000"
const maxDataTableSize = 7; // How many readings the website should hold.
var indexCounter = 0; // Used to keep track on which index to delete from table.
var prev_data_reading;

var clients = [];     // Stores clients

var dataTable = [
  { date: 'test1', time: 'test2', reading: 'test3' },   // DELETE
  { date: 'test', time: 'test', reading: 'test' },      // DELETE     Access last index of reading by: dataTable[dataTable.length-1].reading
];         // Stores data log


// ===    Global Functions    ===
/* data should come in format: "int#str#str#str ..." */
function handleData(data) {
  cnt = data.split("#");
  cnt[0] = parseInt(cnt[0]);
  return cnt;
}


// ===    Functions for Log   ===
function loadTable(dataTable) {     // Edit this function to request table from server (FIREBASE). This would be the ENITRE TABLE.
  let dataHtml = '';
  for(let data of dataTable) {
    indexCounter = indexCounter+1;
    dataHtml += formatLogData(data);
  }
  $("#data-log-table").html(dataHtml);
}

function formatLogData(data) {
  let formated_data = (`<tr id="index${indexCounter}">
                        <td>${data.date}</td>
                        <td>${data.time}</td>
                        <td>${data.reading}%</td></tr>`);
  return formated_data
}

function updateLog(data) {
  // input format:      [int, "day", "month", "year", "clock"]
  // Convert to format: {date: "", time: "", reading: int}
  //    1. Formats data
  //    2. Updates logg
  //    3. Updates linechart
  let formatedData = {date: `${data[3]}/${data[2]}/${data[1]}`, time: `${data[4]}`, reading: data[0]};
  let dataHtml = formatLogData(formatedData);
  $("#data-log-table").prepend(dataHtml);
  prev_data_reading = parseInt(data[0]);
  dataTable.push(formatedData);
  indexCounter = indexCounter+1;
  if(maxDataTableSize < dataTable.length+1) {   // Remove first element of object and table.
    $("#data-log-table tr:last-child").remove();
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

  // Nest the new data into existing data
  socket.on("data->website", (data) => {     // data comes in format: "måling#day#month#year#clock"
    let cnt = handleData(data);  // returns list: ["måling","day","month","year","clock"]
    updateLog(cnt);
    updateBarChart();
    updateLineChartData(prev_data_reading);     // Update linechart
  });

  socket.on('res-data-log', (data) => {
    data = JSON.parse(data);
    loadTable(data);
  });

  socket.on('res-data-barchart', (data) => {
    data = JSON.parse(data);
    loadBarChart(data);
  });

  socket.on('res-data-linechart', (data) => {
    data = JSON.parse(data);
    loadLineChart(data);
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

  /*
    Clicking on a client inside KLIENTER table, sends request to server
    that all charts + log has to be updated according to clients ID (== socket.id on server)
  */
  function handleTDClick() {
    let client_name = $(this).html();
    // Visuals
    $("#client-log-table>tr>td.selected").removeClass("selected");
    $(this).addClass("selected");
    // Request data from server
    socket.emit("req-data-full", client_name);
    console.log("req-data-full from: " + client_name);
  };
});
