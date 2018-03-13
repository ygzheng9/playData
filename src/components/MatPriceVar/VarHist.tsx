import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';
import { Bar, ChartData } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';

import { VarCat } from './types';

const { chartColors, round } = chartUtils;

// 分析查询期间内，最高价格、最低价格 的 变动百分比
// 对 变动百分比 进行分组，下钻到 每个分组内 料号数量、金额；再下钻到 具体的物料

////////////////////////
// 按照 价格波动档次 显示直方图
export interface VarHistProps {
  items: VarCat[];
  onVarCatChange: (x: number) => () => void;
}
function VarHist({ items, onVarCatChange }: VarHistProps) {
  // 计算数量占比，总数量
  const ttl = items.reduce((acc, curr) => {
    acc += curr.count;
    return acc;
  }, 0);

  const cntPect = items.map(i => ({
    ...i,
    countPect: round(i.count / ttl * 100)
  }));

  // 过滤掉变化很小的记录
  const ignore = 0.5;
  const remains = cntPect.filter(i => Math.abs(i.varCat) > ignore);

  // 图表参数
  const chartData: ChartData<chartjs.ChartData> = {
    labels: remains.map(i => `${i.varCat}`),
    datasets: [
      {
        type: 'bar',
        label: '料号数量',
        backgroundColor: chartColors.red,
        data: remains.map(
          i => (i.varCat > 0 ? round(i.count) : -1 * round(i.count))
        ),
        yAxisID: 'y-axis-count'
      }
    ]
  };
  const chartOptions: chartjs.ChartOptions = {
    title: {
      display: true,
      text: '价格波动分析'
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
            labelString: '波动'
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
          id: 'y-axis-count',
          scaleLabel: {
            display: true,
            labelString: '料号数量'
          }
        }
      ]
    }
  };
  const chartTag = (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );

  const columns: Array<ColumnProps<VarCat>> = [
    {
      title: '波动',
      dataIndex: 'varCat',
      key: 'varCat'
    },
    {
      title: '料号数',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => (
        <a onClick={onVarCatChange(record.varCat)}>{text}</a>
      )
    },
    {
      title: '料号数%',
      dataIndex: 'countPect',
      key: 'countPect'
    }
  ];
  // tslint:disable-next-line:max-classes-per-file
  class CatTable extends Table<VarCat> {}
  const tblTag = (
    <CatTable
      size="small"
      dataSource={remains}
      columns={columns}
      rowKey="varCat"
      scroll={{ y: 400 }}
      pagination={false}
    />
  );

  return (
    <Row>
      <Col span={16}>{chartTag}</Col>
      <Col span={8}> {tblTag}</Col>
    </Row>
  );
}

export default VarHist;
