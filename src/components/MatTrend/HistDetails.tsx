import * as React from 'react';

import { Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { MonthlyDetails } from './types';

// 选中了 直方图 中的某个级别后，显示该级别内的物料清单，以及每颗料在 13 个月，每个月的购买信息
export interface HistDetailsProps {
  items: MonthlyDetails[];
}
function HistDetails({ items }: HistDetailsProps) {
  if (items.length === 0) {
    return <div />;
  }

  // 所有的物料结构都一样，所以取第一颗料即可
  const base = items[0];

  // 取出所有月份信息
  const months = base.items.map(i => i.bizMonth);

  // table 的列属性
  // 第一列为 料号；
  const columns: Array<ColumnProps<MonthlyDetails>> = [
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode'
    }
  ];

  // 之后的列是月份
  months.forEach(m => {
    columns.push({
      title: m,
      dataIndex: 'invCode',
      key: m,
      render: (text, record) => {
        let qty = 0;
        // 从 array 中，按照月份，取出对应数据
        const info = record.items.find(i => i.bizMonth === m);
        if (info !== undefined) {
          qty = info.quantity;
        }
        return <div>{qty}</div>;
      }
    });
  });
  // console.log("columns: ", columns);

  // tslint:disable-next-line:max-classes-per-file
  class DetailTable extends Table<MonthlyDetails> {}
  return (
    <DetailTable
      size="middle"
      dataSource={items}
      columns={columns}
      rowKey="invCode"
      pagination={false}
    />
  );
}

export default HistDetails;
