import * as React from 'react';

import { Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { MatPriceInfo } from './types';

// 显示某个档次内的物料详情
export interface VarBreakDetailsProps {
  items: MatPriceInfo[] | undefined;
  varCat: number;
  onMatChange: (inv: string) => () => void;
}
function VarBreakDetails({ items, varCat, onMatChange }: VarBreakDetailsProps) {
  if (items === undefined) {
    return <div>{`${varCat} 无数据`}</div>;
  }

  // 有涨价，有降价
  const remains = items.sort((a, b) => (b.varPect - a.varPect) * varCat);

  const columns: Array<ColumnProps<MatPriceInfo>> = [
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 150,
      render: (text, record) => (
        <a onClick={onMatChange(record.invCode)}>{text}</a>
      )
    },
    {
      title: '波动',
      dataIndex: 'varPect',
      key: 'varPect',
      width: 80
    },
    {
      title: '最低价',
      dataIndex: 'minPrice',
      key: 'minPrice',
      width: 80
    },
    {
      title: '最低价时间',
      dataIndex: 'minDate',
      key: 'minDate',
      width: 100
    },
    {
      title: '最低价订单',
      dataIndex: 'minPO',
      key: 'minPO',
      width: 150
    },
    {
      title: '最高价',
      dataIndex: 'maxPrice',
      key: 'maxPrice',
      width: 80
    },
    {
      title: '最高价时间',
      dataIndex: 'maxDate',
      key: 'maxDate',
      width: 100
    },
    {
      title: '最高价订单',
      dataIndex: 'maxPO',
      key: 'maxPO',
      width: 150
    }
  ];
  // tslint:disable-next-line:max-classes-per-file
  class DetailTable extends Table<MatPriceInfo> {}

  return (
    <DetailTable
      size="middle"
      dataSource={remains}
      columns={columns}
      rowKey={record => record.invCode}
      scroll={{ y: 300 }}
      pagination={{ pageSize: 30 }}
    />
  );
}

export default VarBreakDetails;
