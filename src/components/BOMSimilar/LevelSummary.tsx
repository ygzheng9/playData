import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';
import { ChartData, Pie } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';

const { chartColorsArr, round } = chartUtils;

import { MatLevelType } from './types';

// 显示各个层级的料号数量：饼图 + 表格
export interface LevelSummaryProps {
  items: MatLevelType[];
  onSelectLevel: (level: string) => () => void;
}
function LevelSummary({ items, onSelectLevel }: LevelSummaryProps) {
  if (items.length === 0) {
    return <div />;
  }

  // 增加两个属性
  interface MatLevelTypeEx extends MatLevelType {
    // invList.length
    count: number;
    // count / totalCount
    pect: number;
  }

  // 计算 单个数量
  const cnt = items.map(i => ({ ...i, count: i.invList.length }));

  // 计算 总数量
  const total = R.sum(cnt.map(i => i.count));
  // 计算占比
  const mapped: MatLevelTypeEx[] = cnt.map(i => ({
    ...i,
    pect: round(100 * i.invList.length / total)
  }));

  // 饼图 + 表格
  // pie 参数
  const chartData: ChartData<chartjs.ChartData> = {
    labels: mapped.map(i => i.title),
    datasets: [
      {
        data: mapped.map(i => i.count),
        backgroundColor: mapped.map((_, idx) => chartColorsArr[idx % 7])
      }
    ]
  };
  const chartOptions: chartjs.ChartOptions = {
    title: {
      display: true,
      text: '组件结构分析'
    },
    responsive: true
  };

  const columns: Array<ColumnProps<MatLevelTypeEx>> = [
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: '描述',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) =>
        record.level === 'L' ? (
          <span> {text} </span>
        ) : (
          <a onClick={onSelectLevel(record.level)}>{text}</a>
        )
    },
    {
      title: '占比',
      dataIndex: 'pect',
      key: 'pect'
    }
  ];

  // tslint:disable-next-line:max-classes-per-file
  class LevelTable extends Table<MatLevelTypeEx> {}

  return (
    <Row>
      <Col span={12}>
        <Pie data={chartData} options={chartOptions} />
      </Col>
      <Col span={12}>
        <LevelTable
          dataSource={mapped}
          columns={columns}
          rowKey="level"
          pagination={false}
        />
      </Col>
    </Row>
  );
}

export default LevelSummary;
