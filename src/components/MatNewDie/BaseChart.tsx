import * as React from 'react';

import { Bar } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';

import { BaseProps, RowHeadMat } from './types';

const { chartColors } = chartUtils;

// 图
function BaseChart({ title, baseMonths, pivotData }: BaseProps) {
  // pivotData 中每一元素，都是一个 object，不同的 key 对应不同的值；

  // 取得某一行的信息
  const getRow = (rowHead: string): number[] => {
    // 根据行头，取出对应行；
    const exist = pivotData.find(p => p.rowHead === rowHead);
    if (exist === undefined) {
      return [] as number[];
    }

    // 把 {} 变成 []
    // 月份 是 {} 中的 key
    const results = baseMonths.map(month => exist[month]);
    return results;
  };

  // 图表参数
  const chartData = {
    labels: baseMonths.map(i => i),
    datasets: [
      {
        type: 'line',
        label: '累计12个月',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        data: getRow('12'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '累计9个月',
        borderColor: chartColors.green,
        backgroundColor: chartColors.green,
        borderWidth: 2,
        data: getRow('9'),
        yAxisID: 'y-axis-pect',
        fill: false
      },

      {
        type: 'line',
        label: '累计6个月',
        borderColor: chartColors.orange,
        backgroundColor: chartColors.orange,
        borderWidth: 2,
        data: getRow('6'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '累计3个月',
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blue,
        borderWidth: 2,
        data: getRow('3'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '料号数量',
        borderColor: chartColors.grey,
        backgroundColor: chartColors.grey,
        borderWidth: 2,
        data: getRow(RowHeadMat),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `${title}`
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
            labelString: '采购月份'
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
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-pect',
          scaleLabel: {
            display: true,
            labelString: '新料号%'
          }
        }
      ]
    }
  };
  return (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );
}

export default BaseChart;
