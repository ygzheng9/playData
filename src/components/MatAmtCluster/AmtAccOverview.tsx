import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';

import { ChartData, Line } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';
import { LabelInfo, MatGrpExpand } from './types';

const { chartColors, round } = chartUtils;

// 采购金额集中度分析
// 料号，按金额从大到小排序，显示累计百分比 + 每  10% 中料号数量
// items: 每个物料的采购金额，按照金额从大到小排序，累计占比有标记
export interface AmtAccOverviewProps {
  items: MatGrpExpand[];
  onSelectGroup: (s: string) => () => void;
}
function AmtAccOverview({ items, onSelectGroup }: AmtAccOverviewProps) {
  // 根据每个物料的采购金额，计算物料金额集中度；
  // 也即：金额从高到底排序后，前 10% 有多少颗料；10~20% 有多少颗料； 20~30% 有多少颗料；
  // 分级标记，在传入参数中已经有了，这里只是按标记，进行汇总数量；
  const byLabel = (): LabelInfo[] => {
    // 对每个类型进行计数
    // reduce 之后的结果是：label, count, amount / 每个分组，分组内的数量，分组内的金额
    const c: LabelInfo[] = items.reduce(
      (acc, curr) => {
        const exist = acc.find(a => a.label === curr.label);
        if (exist === undefined) {
          acc.push({
            label: curr.label,
            count: 1,
            amount: curr.totalAmt,
            accAmt: 0,
            accPect: 0,
            seqNo: 0
          });
        } else {
          exist.count += 1;
          exist.amount += curr.totalAmt;
        }
        // reduce 一定要返回一个值，作为 acc；
        return acc;
      },
      [] as LabelInfo[]
    );

    // 计算每档的累计金额
    // 增加: accAmt
    const t: LabelInfo[] = [];
    c.forEach((i, idx) => {
      let accAmt = i.amount;
      if (idx !== 0) {
        accAmt += t[idx - 1].accAmt;
      }
      t.push({ ...i, accAmt });
    });

    // 计算累计占比
    // 计算总金额
    const ttl = items.reduce((acc, curr) => acc + curr.totalAmt, 0);

    // 增加：accPect, seqNo
    const results: LabelInfo[] = t.map((i, idx) => ({
      ...i,
      accPect: round(i.accAmt / ttl * 100),
      seqNo: idx + 1
    }));

    return results;
  };

  const inputs = byLabel();

  // 柱状图所需数据
  const chartData: ChartData<chartjs.ChartData> = {
    labels: inputs.map(i => i.label),
    datasets: [
      {
        label: '料号数量（log2）',
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        fill: false,
        // 因为数量相差太大，为了优化显示，这里取 log2
        data: inputs.map(i => round(Math.log2(i.count)))
      }
    ]
  };

  // 柱状图参数：图的 title，tooltip，横纵坐标 title
  const chartOptions: chartjs.ChartOptions = {
    responsive: true,
    title: {
      display: true,
      text: '采购金额集中度分析'
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '% 累计金额'
          }
        }
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '料号数量（log2）'
          }
        }
      ]
    }
  };

  // 表格所需数据
  const columns: Array<ColumnProps<LabelInfo>> = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo'
    },
    {
      title: '分组',
      dataIndex: 'label',
      key: 'label'
    },
    {
      title: '组内料号',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => {
        return <a onClick={onSelectGroup(record.label)}>{text}</a>;
      }
    },
    {
      title: '累计比例',
      dataIndex: 'accPect',
      key: 'accPect'
    }
  ];
  // tslint:disable-next-line:max-classes-per-file
  class LabelTable extends Table<LabelInfo> {}

  return (
    <Row>
      <Col span={16}>
        <Line
          data={chartData}
          options={chartOptions}
          width={600}
          height={400}
        />
      </Col>
      <Col span={8}>
        <LabelTable
          size="middle"
          dataSource={inputs}
          columns={columns}
          rowKey={record => record.label}
          pagination={false}
        />
      </Col>
    </Row>
  );
}

export default AmtAccOverview;
