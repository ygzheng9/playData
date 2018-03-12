import * as React from 'react';

import { Bar } from 'react-chartjs-2';

import { MonthSummary } from '../../routes/MatType';

import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

// TrendChart 根据每个月的数据，画图
// 每个月的采购量，这些量中，有多少是重复购买的；
export interface TrendOverviewProps {
  items: MonthSummary[];
  selectedMonth: string;
}
function TrendOverview({ items, selectedMonth }: TrendOverviewProps) {
  // 查看：查询月份 中的物料号，曾经在 比对月份，重复出现的次数
  const baseMonth = items.find(i => i.bizMonth === selectedMonth);
  if (baseMonth === undefined) {
    return <div />;
  }

  // 比对月份
  const revData = items.map(i => i.bizMonth).map(m => {
    // 对每一个比对月份，查询月份的物料，出现过
    const cnt = baseMonth.details.filter(
      d => d.repeated.find(r => r === m) !== undefined
    ).length;

    const pect = round(cnt / baseMonth.totalCnt * 100);

    return {
      bizMonth: m,
      baseRepeatCnt: cnt,
      baseRepectCntPect: pect
    };
  });
  // 查询月份，手工修正数据
  const baseOne = revData.find(r => r.bizMonth === selectedMonth);
  if (baseOne === undefined) {
    return <div />;
  }
  baseOne.baseRepectCntPect = baseMonth.repeatCntPect;

  // 图表参数
  const chartData = {
    labels: items.map(i => i.bizMonth),
    datasets: [
      {
        type: 'line',
        label: '料号当月%',
        borderColor: chartColors.purple,
        backgroundColor: chartColors.purple,
        borderWidth: 2,
        data: items.map(i => round(i.repeatCntPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '料号查询月%',
        borderColor: chartColors.yellow,
        backgroundColor: chartColors.yellow,
        borderWidth: 2,
        data: revData.map(i => round(i.baseRepectCntPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '总金额',
        backgroundColor: chartColors.green,
        data: items.map(i => round(i.totalAmt)),
        yAxisID: 'y-axis-amt'
      },
      {
        type: 'bar',
        label: '重复金额',
        backgroundColor: chartColors.red,
        data: items.map(i => round(i.repeatAmt)),
        yAxisID: 'y-axis-amt'
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: '物料延续性分析'
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
            labelString: '月份'
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
          id: 'y-axis-amt',
          scaleLabel: {
            display: true,
            labelString: '金额'
          }
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-pect',
          scaleLabel: {
            display: true,
            labelString: '料号数量'
          }
        }
      ]
    }
  };
  return (
    <div>
      <Bar data={chartData} options={chartOptions} width={600} height={300} />
    </div>
  );
}

export default TrendOverview;
