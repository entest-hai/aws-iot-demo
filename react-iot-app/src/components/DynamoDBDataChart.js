// Hai Tran APR 13 2022 
// Use chartjs react-chartjs-2 to create a chart with data fetched from DB
// Example: https://github.com/reactchartjs/react-chartjs-2/blob/master/sandboxes/line/default/App.tsx
// React.StrictMode causes useEffect fetch data twice 


import { useEffect, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
} from 'chart.js';
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
);

// const 
const apiUrl = 'https://lfrgjf1fcg.execute-api.ap-southeast-1.amazonaws.com/prod/iot';
const bufferSize = 20;
const labels = [...Array(bufferSize).keys()];
var chart;
var dbTimer;

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      suggestedMin: -10,
      suggestedMax: 50
    }
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Data Fetched from DynamoDB-Topic-Tempature',
    },
  },
};


function updateChart(chart, newData) {
  chart.data.datasets.forEach((dataset) => {
    dataset.data = newData;
  });
  chart.update();
}

const DynamoDBDataChart = ({ childFunc }) => {

  useEffect(() => {
    childFunc.current = stopTimer;
  }, [])

  function stopTimer() {
    // console.log('stop timer ...')
    // clearInterval(dbTimer);
    return 1;
  }

  useEffect(() => {
    const canvas = document.getElementById('myChart');
    const ctx = canvas.getContext('2d');
    chart = new Chart(
      ctx,
      {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Tempature',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: new Array(bufferSize).fill(null),
            tension: 0.1
          }]
        },
        options: options
      }
    )

  }, [])

  useEffect(() => {

    async function fetchData() {
      // call api to fetch data from db 
      const res = await fetch(apiUrl);
      const data = await res.json();
      // get items 
      const items = data.Items;
      // parse tempatures
      const tempatures = items.map(item => item.payload.tempature);
      // parse timestamp 
      const timestamps = items.map(item => item.payload.timestamp);
      // 
      console.log(tempatures);
      // update the chart
      updateChart(chart, tempatures);
    }

    const keepPullingData = () => {
      dbTimer = setInterval(async () => {
        fetchData();
      }, 2000)
    }

    fetchData();
    keepPullingData();

    return () => {
      clearInterval(dbTimer);
      console.log('stop timer by clean user effect...');
    }

  }, [])

  return (
    <div style={{ width: '800px', height: '450px', margin: 'auto', marginBottom: '50px' }}>
      <canvas id='myChart'></canvas>
    </div>
  );
}

export default DynamoDBDataChart; 