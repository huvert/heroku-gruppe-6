

const HOST = "http://192.168.1.12:4000"
var prev_data_reading = null; // Last updated data
maxDataTableSize = 4; // How many readings the website should hold.
indexCounter = 0; // Used to keep track on which index to delete from table.

var dataTable = [
  { date: 'test1', time: 'test2', reading: 'test3' },   // DELETE
  { date: 'test', time: 'test', reading: 'test' },      // DELETE
];


/* == Functions == */
/* Functions are written like this to protect them from colliding
   with other imported libraries. */

myFuncs = {
  hide_all_windows:function(filter = null) {
    if (filter !== "commands") {
      $("#window-commands").slideUp(200);
    }
    if (filter !== "data") {
      $("#window-data").slideUp(200);
    }
  }
};

function getPreviousReading() {
    return prev_data_reading   // This variable is updated every 'x' seconds. This time is set on the server.
}

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
  let formatedData = {date: `${data[3]}/${data[2]}/${data[1]}`, time: `${data[4]}`, reading: data[0]};
  let dataHtml = (`<tr><td>${formatedData.date}</td><td>${formatedData.time}</td><td>${formatedData.reading}</td></tr>`);
  $("#data-log-table").append(dataHtml);
  prev_data_reading = parseInt(data[0]);
  dataTable.push(formatedData);
  indexCounter = indexCounter+1;
  if(maxDataTableSize < dataTable.length) {   // Remove first element of object and table.
    $("#data-log-table tr:first-child").remove();
    $(`#index${indexCounter-maxDataTableSize}`).remove();
  }
}


// ===  Socket IO   ===
$(function() {          // Waits for document to fully load before executing any JS code
  var socket = io.connect();
  socket.emit("join-room", "website");  // Request to join room: website

  $('#command-form').submit(function(e) {
    e.preventDefault();                             // prevents page reloading
    socket.emit('chat-message', $('#command-input').val());
    $('#command-input').val('');
    return false;
  });


  socket.on("data->website", (data) =>{     // data comes in format: "måling#day#month#year#clock"
    console.log("received data from server");
    let cnt = handleData(data);  // returns list: ["måling","day","month","year","clock"]
    handleLevelSensorData(cnt);
  });



//  ===   Plotly Graph setup  ===
var layout = {
  title: "Fancy Swancy Graph",
  paper_bgcolor: '#32e0c4',
  plot_bgcolor: '#eeeeee',
  xaxis: {title: 'Time [s]'},
  yaxis: {title: 'Preassure [Pa]'}
};
Plotly.plot('chart',[{          // Creates original chart
    y:[getPreviousReading()],
    type:'line',
    fill: 'tozeroy',
    line: {color: '#112d4e'},
}],layout);

var cnt = 0;
const slide_length = 100         // Lenght before slides starts


  // === Plotly graph update values ===
  setInterval(function(){
      Plotly.extendTraces('chart',{ y:[[getPreviousReading()]]}, [0]);     // Extends chart
      cnt++;
      if(cnt > slide_length) {
          Plotly.relayout('chart',{
              xaxis: {
                  range: [cnt-slide_length,cnt]
              }
          });
      }
  },3000);
});



// ===  Navbar Links and Animations  ===
$("#nav-logo").on("click", function() {
  myFuncs.hide_all_windows();
});

$("#nav-commands").on("click", function() {
  console.log("commands pressed")
  myFuncs.hide_all_windows("commands");
  $("#window-commands").slideDown(200);
});

$("#nav-data").on("click", function() {
  myFuncs.hide_all_windows("data");
  $("#window-data").slideDown(200);
})
