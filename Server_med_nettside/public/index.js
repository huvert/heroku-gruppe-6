

const HOST = "http://192.168.1.12:4000"
var prev_data_reading = null; // Last updated data
maxDataTableSize = 20; // How many readings the website should hold.
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
    if (filter !== "admin") {
      $("#window-admin").slideUp(200);
    }
    if (filter !== "log") {
      $("#window-log").slideUp(200);
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


// ====================================
// ===          Socket IO           ===
$(function() {          // Waits for document to fully load before executing any JS code
  var socket = io.connect();
  socket.emit("join-room", "website");  // Request to join room: website

  $('#command-form').submit(function(e) {
    e.preventDefault();                             // prevents page reloading
    socket.emit('chat-message', $('#command-input').val());
    $('#command-input').val('');
    return false;
  });

  $("#nav-data").on("click", function() {
    console.log("req-scater-plot");
    socket.emit('req-scatter-plot', "");
  });

  socket.on('res-scatter-plot', (data) => {
    console.log("res-scatter-plot");
    $('#scatterplot').html(data);
  });

  socket.on("data->website", (data) =>{     // data comes in format: "måling#day#month#year#clock"
    console.log("received data from server");
    let cnt = handleData(data);  // returns list: ["måling","day","month","year","clock"]
    handleLevelSensorData(cnt);
  });


  // ====================================
  // ===           Plots              ===

//  ===   Plotly Line-Graph setup  ===
var cnt = 0;
const slide_length = 100         // Lenght before slides starts

var line_layout = {
  title: "Fancy Swancy Graph",
  paper_bgcolor: '#32e0c4',
  plot_bgcolor: '#eeeeee',
  xaxis: {title: 'Time [s]'},
  yaxis: {title: 'Preassure [Pa]'},
  height: 600,
  width: 950,
};
Plotly.plot('line-chart',[{          // Creates original line-chart
    y:[getPreviousReading()],
    type:'line',
    fill: 'tozeroy',
    line: {color: '#112d4e'},
}],line_layout);

  // -- Plotly graph update values --
  setInterval(function(){
      Plotly.extendTraces('line-chart',{ y:[[getPreviousReading()]]}, [0]);     // Extends line-chart
      cnt++;
      if(cnt > slide_length) {
          Plotly.relayout('line-chart',{
              xaxis: {
                  range: [cnt-slide_length,cnt]
              }
          });
      }
  },3000);
});




// ====================================
// ===          Animations          ===

// ===  Navbar Links and Animations  ===
$("#nav-logo").on("click", function() {
  myFuncs.hide_all_windows();
});

$("#nav-commands").on("click", function() {
  myFuncs.hide_all_windows("commands");
  $("#window-commands").slideDown(200);
});

$("#nav-log").on("click", function() {
  myFuncs.hide_all_windows("log");
  $("#window-log").slideDown(200);
});

$("#nav-data").on("click", function() {
  myFuncs.hide_all_windows("data");
  $("#window-data").slideDown(200);
});

$("#nav-admin").on("click", function() {
  myFuncs.hide_all_windows("admin");
  $("#rick-rolled").html('');
  $("#admin-container").show();
  $("#window-admin").slideDown(200);
});

// ===  Other buttons and animations  ===
$(".admin-btn").on("click", function() {
  console.log("HELLO");
  $("#admin-container").hide();
  $("#rick-rolled").html('<div class="iframe-container"><iframe src="https://www.youtube.com/embed/BBJa32lCaaY?autoplay=1&rel=0&controls=0&disablekb=1" width="560" height="315" frameborder="0" allow="autoplay"></iframe></div>');
});
