
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
