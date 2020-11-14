"use strict";

const HOST = "http://192.168.1.12:4000";
const maxDataTableSize = 7; // How many readings the website should hold.
var prev_data_reading;
var selected_client;

var clients = [];     // Stores clients by names (not ID)
var dataTable = [];         // Stores data log


// ===    Global Functions    ===
/* data should come in format: "int#str#str#str ..." */
function handleData(data) {
  let cnt = data.split("#");
  cnt[0] = parseInt(cnt[0]);
  prev_data_reading = cnt[0];
  return cnt;
}


// ===    Functions for Log (logg tab on navbar)   ===
var log = {
  indexCounter: 0,                 // Keeps track on # of indexes

  loadTable: function(dataTable) {
    prev_data_reading = dataTable[0].reading; // Update global variable
    let dataHtml = '';
    for(let data of dataTable) {
      log.indexCounter = log.indexCounter+1;
      dataHtml += log.formatData(data);
    }
    $("#data-log-table").html(dataHtml);
  },

  formatData: function(data) {
    let formated_data = (`<tr id="index${log.indexCounter}">
                          <td>${data.date}</td>
                          <td>${data.time}</td>
                          <td>${data.reading}%</td></tr>`);
    return formated_data
  },

  update: function(data) {
    // input format:      [int, "day", "month", "year", "clock"]
    // Convert to format: {date: "", time: "", reading: int}
    //    1. Formats data
    //    2. Updates logg
    //    3. Updates linechart
    let formatedData = {date: `${data[3]}/${data[2]}/${data[1]}`, time: `${data[4]}`, reading: data[0]};
    let dataHtml = log.formatData(formatedData);
    $("#data-log-table").prepend(dataHtml);
    dataTable.push(formatedData);
    log.indexCounter = log.indexCounter+1;
    if(maxDataTableSize < dataTable.length+1) {   // Remove first element of object and table.
      $("#data-log-table tr:last-child").remove();
      $(`#index${log.indexCounter-maxDataTableSize}`).remove();
    }
  }
};





// ====================================
// ===          Socket IO           ===
$(function() {          // Waits for document to fully load before executing this block
  var socket = io.connect();
  socket.emit("join-room", "website");  // Request to join room: website
  socket.emit("req-client-list", "");   // require full list of "esp" clients connected to server
  socket.on("res-client-list", (clients_list) => {
    console.log("[res-client-list] Updating client list");
    clients = JSON.parse(clients_list);
    updateClientLogTable();
  });

  $('#stop-button').click(() =>  {
    console.log("STOP");
    socket.emit("maintenance", `${selected_client}#0`);
  });

  $('#start-button').click(() => {
    console.log("START");
    socket.emit("maintenance", `${selected_client}#1`);
  });

  $('#command-form').submit(function(e) {
    e.preventDefault();                             // prevents page reloading
    socket.emit('chat-message', $('#command-input').val());
    $('#command-input').val('');
    return false;
  });

  // Nest the new data into existing data
  socket.on("data->website", (data) => {  //in format: "måling#day#month#year#clock#client_name"
    let cnt = handleData(data);           //in format: ["måling","day","month","year","clock","client_name"]
    // Only handle data if from selceted client
    if (data[data.length-1] === selected_client) {
      console.log("[data->website] New livedata received");
      cnt.pop();
      log.update(cnt);
      updateBarChart();
      updateLineChartData(prev_data_reading);     // Update linechart
    }
  });

  socket.on('res-data-log', (data) => {
    console.log("[res-data-log]");
    data = JSON.parse(data);
    log.loadTable(data);
  });

  socket.on('res-data-barchart', (data) => {
    console.log("[res-data-barchart]");
    data = JSON.parse(data);
    loadBarChart(data);
  });

  socket.on('res-data-linechart', (data) => {
    console.log("[res-data-linechart]");
    data = JSON.parse(data);
    loadLineChart(data);
  });


  // --   Functions for KLIENTER table on front page   --

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
    selected_client = client_name;
    // Visuals
    $("#client-log-table>tr>td.selected").removeClass("selected");
    $(this).addClass("selected");
    $("#servo-btn-panel").show();
    // Request data from server
    socket.emit("req-data-full", client_name);
    console.log("req-data-full from: " + client_name);
  };
});
