// import * as R from 'ramda';

import * as React from 'react';

import { Bar } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

import { HistProps } from './types';

// 直方图
function HistChart({ items }: HistProps) {
  // 图表参数
  const chartData = {
    labels: items.map(i => `${i.grade}`),
    datasets: [
      {
        type: 'bar',
        label: '组件数量',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        borderWidth: 2,
        data: items.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `BOM 组件复用度分析`
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    responsive: true,
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '组件复用数量'
          },
          ticks: {
            display: true
          }
        }
      ],
      yAxes: [
        {
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-cnt',
          scaleLabel: {
            display: true,
            labelString: '料号数'
          }
        }
      ]
    }
  };
  return (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );
}

export default HistChart;
