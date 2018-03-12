import * as React from 'react';

import { Table } from 'antd';

import { CellDetailType } from './types';

// 选中单元格后，显示单元格的明细
export interface BaseDetailsProps {
  // 对应当前点击的单元格信息
  clickedMonth: string;
  clickedHead: string;
  clickedDetails: CellDetailType[];
}
function BaseDetails({
  clickedMonth,
  clickedHead,
  clickedDetails
}: BaseDetailsProps) {
  if (clickedDetails.length === 0) {
    return <div />;
  }

  const tblData = clickedDetails.map((i, idx) => ({ ...i, seqNo: idx + 1 }));

  const columns = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 100
    },
    {
      title: '月份',
      dataIndex: 'bizMonth',
      key: 'bizMonth',
      width: 200
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 200
    },
    {
      title: '采购量',
      dataIndex: 'qty',
      key: 'qty',
      width: 200
    },
    {
      title: '采购金额',
      dataIndex: 'amt',
      key: 'amt',
      width: 200
    }
    // {
    //   title: '金额占比',
    //   dataIndex: 'amtPect',
    //   key: 'amtPect'
    // }
  ];

  const msg = `${clickedMonth} - ${clickedHead}`;

  return (
    <div>
      {msg}
      <Table
        size="middle"
        dataSource={tblData}
        columns={columns}
        rowKey="invCode"
        scroll={{ y: 300 }}
        pagination={{ pageSize: 500 }}
      />
    </div>
  );
}

export default BaseDetails;
