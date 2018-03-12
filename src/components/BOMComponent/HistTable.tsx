// import * as R from 'ramda';

import * as React from 'react';

import { Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { HistInfo, HistProps } from './types';

// 直方图 对应的 表格
function HistTable({ items, onSelectGrade }: HistProps) {
  if (items.length === 0) {
    return <div />;
  }

  const columns: Array<ColumnProps<HistInfo>> = [
    {
      title: '复用次数',
      dataIndex: 'grade',
      key: 'grade',
      width: 50
    },
    {
      title: '子件数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (text, record) => (
        <a onClick={onSelectGrade(record.grade)}>{text} </a>
      )
    },
    {
      title: '占比',
      dataIndex: 'pect',
      key: 'pect',
      width: 100
    },
    {
      title: '累计占比',
      dataIndex: 'accPect',
      key: 'accPect',
      width: 100
    }
  ];

  class ItemTable extends Table<HistInfo> {}
  return (
    <ItemTable
      size="small"
      dataSource={items}
      columns={columns}
      rowKey="grade"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );
}

export default HistTable;
