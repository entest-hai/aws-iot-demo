// Hai Tran APR 13 2022 
// Use chartjs react-chartjs-2 to create a chart with data fetched from DB
// Example: https://github.com/reactchartjs/react-chartjs-2/blob/master/sandboxes/line/default/App.tsx
// React.StrictMode causes useEffect fetch data twice 
import { useEffect, useState } from 'react';
import Amplify, { PubSub } from 'aws-amplify';
import { AWSIoTProvider } from '@aws-amplify/pubsub';

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

var chart;

// 
var subscriber = null;

Amplify.addPluggable(
  new AWSIoTProvider({
    aws_pubsub_endpoint: 'wss:a2tfs6uw3j7iz3-ats.iot.ap-southeast-1.amazonaws.com/mqtt',
    aws_pubsub_region: 'ap-southeast-1'
  })
)

const iotBufferSize = 200;
var buffer = new Array(iotBufferSize).fill(null);
const ioTDataLabels = [...Array(iotBufferSize).keys()];


const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      suggestedMin: -25,
      suggestedMax: 25
    }
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Data Subscribed from IoT Topic-Signal',
    },
  },
};

function updateChart(chart, newData) {
  chart.data.datasets.forEach((dataset) => {
    dataset.data = newData;
  });
  chart.update();
}

const IoTSubDataChart = ({ childFunc }) => {

  useEffect(() => {
    childFunc.current = unsubscribe
  }, [])

  function unsubscribe() {
    console.log('unsubscribe IoT...')
    subscriber.unsubscribe();
    return 1;
  }

  useEffect(() => {

    // init the chart 
    const canvas = document.getElementById('IoTSubDataChart');
    const ctx = canvas.getContext('2d');
    chart = new Chart(
      ctx,
      {
        type: 'line',
        data: {
          labels: ioTDataLabels,
          datasets: [{
            label: 'Tempature',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: Array(iotBufferSize).fill(0),
            tension: 0.1
          }]
        },
        options: options
      }
    )
  }, [])

  useEffect(() => {

    const subscribe = () => {
      subscriber = PubSub.subscribe('topic/signal', { provider: 'AWSIoTProvider' }).subscribe({
        next: data => {
          try {
            // sub and parse data from IoT 
            console.log('message ', data.value.signal)
            let newData = [data.value.signal];
            buffer = newData.concat(buffer);
            buffer.pop();
            // update chart
            updateChart(chart, buffer);

          } catch (error) {
            console.log(error)
          }
        },
        error: error => console.log(error),
        complete: () => console.log('Done')
      })

    }

    subscribe();

  }, [])

  return (
    <div style={{ width: '800px', height: '450px', margin: 'auto' }}>
      <canvas id='IoTSubDataChart'></canvas>
    </div>
  );
}

export default IoTSubDataChart; 