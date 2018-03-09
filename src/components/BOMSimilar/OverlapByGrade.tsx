import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';

import { Bar } from 'react-chartjs-2';

// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

import { BOMOverlap } from './types';

// 按照物料的相关物料的数量等级，分级展示，柱状图 + 表格；

// 分等级，展示 overlap
export interface OverlapByGradeProps {
  items: BOMOverlap[];
  onSelectGrade: (grade: number) => () => void;
}
function OverlapByGrade({ items, onSelectGrade }: OverlapByGradeProps) {
  // distinct grade
  const grades = R.uniq(items.map(i => i.grade));
  // group by grade
  const mapped = grades.map(g => {
    const exist = items.filter(i => i.grade === g);
    return {
      grade: g,
      count: exist === undefined ? 0 : exist.length
    };
  });

  //  按等级分类汇总
  interface GradeType {
    grade: number;
    count: number;
  }

  // 按 grade 从小到大排序
  const sorted: GradeType[] = mapped.sort((a, b) => a.grade - b.grade);

  const columns: Array<ColumnProps<GradeType>> = [
    {
      title: '相关等级',
      dataIndex: 'grade',
      key: 'grade'
    },
    {
      title: '组件数量',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => (
        <a onClick={onSelectGrade(record.grade)}> {text} </a>
      )
    }
  ];

  const tblTag = (
    <Table
      size="middle"
      dataSource={sorted}
      columns={columns}
      rowKey="grade"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );

  // 曲线图
  // 图表参数
  const chartData = {
    labels: sorted.map(i => `${i.grade}`),
    datasets: [
      {
        type: 'bar',
        label: '组件数',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        borderWidth: 2,
        data: sorted.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `组件相似度分析`
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
            labelString: '相关组件数'
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
            labelString: '组件数'
          }
        }
      ]
    }
  };

  const chartTag = (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );

  return (
    <Row>
      <Col span={16}>{chartTag}</Col>
      <Col span={8}>{tblTag}</Col>
    </Row>
  );
}

export default OverlapByGrade;
