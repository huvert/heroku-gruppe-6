
var current_time = new Date();
var last_level_value;

// Returns time untill next quarter (15min) in seconds.
/* Ordinær ligning: 60(15-(Minutes%15)) - Sekunder
   This function is used to sync the graph with your computers time */
function getInitTime() {
  current_time = new Date();
  return 60*(15-(current_time.getMinutes()%15)) - current_time.getSeconds()
}

// Used to label graph
function getHours() {
  let t = current_time.getHours();
  if (t < 10) {
    return `0${t}:00`
  }
  return `${t}:00`
}

// The 2 following functions can be used on any chart
function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    chart.update();
}

function removeData(chart) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
}


// ========================================
// ===           LineGraph              ===
/*
  X-axis is updated every 15minutes
  Y-axis is updated every 15minutes BUT will edit last index in data list
  when receiving new data pack from server.
*/

var ctx = document.getElementById('line-chart').getContext('2d');
var linechart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: ['00:00','','','','01:00','','','','02:00','','','','03:00','','','','04:00',
                  '','','','05:00','','','','06:00','','','','07:00','','','','08:00','','','',
                  '09:00','','','','10:00','','','','11:00','','','','12:00','','','','13:00',
                  '','','','14:00','','','','15:00','','','','16:00','','','','17:00','','','',
                  '18:00','','','','19:00','','','','20:00','','','','21:00','','','','22:00',
                  '','','','23:00','','',''],
        datasets: [{
            label: 'Soap Dispenser Level [%]',
            backgroundColor: '#0d7377',
            borderColor: '#212121',
            data: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                  0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                  0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
                  0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,]   // len: 24
        }]
    },

    // Configuration options go here
    options: {
      responsive: true,
      maintainAspectRatio: false,

    }
});


// Update labels and data-axis (hvert kvarter)
setTimeout(() => {
  updateLineChart();
  setInterval(() => {
    updateLineChart();
  }, 15*60*1000);               // Hvert kvarter: 15*60*1000
}, getInitTime()*1000);

function updateLineChart() {
  let new_label = '';
  let new_data = dataTable[dataTable.length-1].reading;  // Last received value from client
  current_time = new Date();
  if (current_time.getMinutes() == 0) {   // Update label hver time.
    new_label = getHours();
  }
  removeData(linechart);
  addData(linechart, new_label, new_data);
}

// When receiving new data from client the linechart should update y-axis
// without updating x-axis.
function replaceLastDataLineChart(data) {
  linechart.data.datasets[0].data.pop();
  linechart.data.datasets[0].data.push(data);
  linechart.update();
}

// TODO: create functions that takes data from FIREBASE and updates entire Chart
// Lenght of x-axis should be 24 * 4 = 96
function fullyUpdateLineChart(data) {

  let new_data;
  let labels;


  // data from ??? --> data[96] & labels[96]


  // replace data and labels in linechart.
  linechart.data.datasets[0].data = new_data;
  linechart.data.labels = labels;
}
