import * as React from 'react';

import { Table } from 'antd';

import { BaseProps } from './types';

function BaseTable({ title, baseMonths, pivotData, clickCell }: BaseProps) {
  // table 需要的列定义
  const baseMonthCols = baseMonths.map(month => ({
    title: month,
    dataIndex: month,
    key: month,
    render: (text: number, record: any) => {
      return <a onClick={clickCell(month, record.rowHead)}> {text} </a>;
    }
  }));

  // 加上第一列
  const columns = [
    {
      title: '#',
      dataIndex: 'rowHead',
      key: 'rowHead'
    },
    ...baseMonthCols
  ];

  return (
    <Table
      size="middle"
      dataSource={pivotData}
      columns={columns}
      rowKey="rowHead"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );
}

export default BaseTable;
