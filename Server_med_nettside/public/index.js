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


$(function() {          // Waits for document to fully load before executing any JS code
  var socket = io();
  $('#command-form').submit(function(e) {
    e.preventDefault();                             // prevents page reloading
    socket.emit('chat message', $('#command-input').val());
    $('#command-input').val('');
    return false;
  });
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


//  =============================
//  ===   Plotly Graph (LINE) ===
var val = 0.5;
function getData() {              // Data from ESP comes here (Interval between data should be set on server side.)
    val += Math.random() - 0.5;
    return val
};
var layout = {
  title: "Fancy Swancy Graph",
  paper_bgcolor: '#32e0c4',
  plot_bgcolor: '#eeeeee',
  xaxis: {title: 'Time [s]'},
  yaxis: {title: 'Preassure [Pa]'}
};
Plotly.plot('chart',[{          // Creates original chart
    y:[getData()],
    type:'line',
    fill: 'tozeroy',
    line: {color: '#112d4e'},
}],layout);

var cnt = 0;
const slide_length = 100         // Lenght before slides starts

setInterval(function(){
    Plotly.extendTraces('chart',{ y:[[getData()]]}, [0]);     // Extends chart
    cnt++;
    if(cnt > slide_length) {
        Plotly.relayout('chart',{
            xaxis: {
                range: [cnt-slide_length,cnt]
            }
        });
    }
},400);

//      $('Selector').method();
// ex:  $('#id').hide(300).show(1000);
// ex:  $('#id').css({color:'red',fontWeight:'bold'});
