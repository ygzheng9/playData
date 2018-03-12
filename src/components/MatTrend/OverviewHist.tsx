import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { Bar } from 'react-chartjs-2';

import { MonthSummary } from '../../routes/MatType';
import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

// 查询月份的物料，按在之前 12 个月购买的次数（L），做直方图 + 表格数据；
// 比如：购买过 2 次的物料 x 个；购买过 10 次的物料 y 个；

export interface OverviewHistProps {
  monthData: MonthSummary | undefined;
  onRepeatTimesChange: (x: number) => () => void;
}
function OverviewHist({ monthData, onRepeatTimesChange }: OverviewHistProps) {
  if (monthData === undefined) {
    return <div />;
  }

  const { bizMonth, details, totalAmt, totalCnt } = monthData;

  // reduce 的结果值
  // 重复的次数，对应的料号数量，金额；数量/金额 占比
  interface ResultType {
    times: number;
    count: number;
    amount: number;

    countPect: number;
    amountPect: number;
  }
  const resInit: ResultType[] = [];

  // 每颗料，按重复次数 group，计数料号数量，金额；
  const items: ResultType[] = details
    .map(i => ({ ...i, times: i.repeated.length }))
    .sort((a, b) => a.times - b.times)
    .reduce((acc, curr) => {
      const exist = acc.find(a => a.times === curr.times);
      if (exist === undefined) {
        acc.push({
          times: curr.times,
          count: 1,
          amount: curr.amt,
          countPect: 0,
          amountPect: 0
        });
      } else {
        exist.count += 1;
        exist.amount += curr.amt;
      }
      return acc;
    }, resInit)
    .map(t => ({
      ...t,
      amount: round(t.amount),
      countPect: round(t.count / totalCnt * 100),
      amountPect: round(t.amount / totalAmt * 100)
    }));

  // 图表参数
  const chartData = {
    labels: items.map(i => `${i.times}`),
    datasets: [
      {
        type: 'line',
        label: '金额%',
        borderColor: chartColors.purple,
        backgroundColor: chartColors.purple,
        borderWidth: 2,
        data: items.map(i => round(i.amountPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '料号%',
        borderColor: chartColors.yellow,
        backgroundColor: chartColors.yellow,
        borderWidth: 2,
        data: items.map(i => round(i.countPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '料号数',
        backgroundColor: chartColors.red,
        data: items.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt'
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `${bizMonth} 物料重复购买分析`
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
            labelString: '重复次数'
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
            labelString: '%'
          }
        }
      ]
    }
  };
  const chartTag = (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );

  const columns: Array<ColumnProps<ResultType>> = [
    {
      title: '重复次数',
      dataIndex: 'times',
      key: 'times'
    },
    {
      title: '料号数',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => (
        <a onClick={onRepeatTimesChange(record.times)}>{text}</a>
      )
    },
    {
      title: '料号数%',
      dataIndex: 'countPect',
      key: 'countPect'
    },
    {
      title: '金额%',
      dataIndex: 'amountPect',
      key: 'amountPect'
    }
  ];

  class ItemTable extends Table<ResultType> {}
  const tableTag = (
    <ItemTable
      size="small"
      dataSource={items}
      columns={columns}
      rowKey="times"
      pagination={false}
    />
  );

  return (
    <Row>
      <Col span={16}>{chartTag}</Col>
      <Col span={8}>{tableTag}</Col>
    </Row>
  );
}

export default OverviewHist;
