import * as React from 'react';

import { Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import chartUtils from '../../utils/chartUtils';

import { MatGrpExpand } from './types';

const { round } = chartUtils;

// 选中了某个级别后，显示该级别下的具体明细信息
export interface CategoryDetailsProps {
  items: MatGrpExpand[];
  onSelectMat: (s: string) => () => void;
}

function CategoryDetails({ items, onSelectMat }: CategoryDetailsProps) {
  const remains = items.map((i, idx) => ({
    ...i,
    amtPect: round(i.amtPect),
    quantity: round(i.quantity),
    seqNo: idx + 1
  }));

  const columns: Array<ColumnProps<MatGrpExpand>> = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo'
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode'
    },
    {
      title: '金额%',
      dataIndex: 'amtPect',
      key: 'amtPect'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '次数',
      dataIndex: 'lineCnt',
      key: 'lineCnt',
      render: (text, record) => (
        <a onClick={onSelectMat(record.invCode)}>{text}</a>
      )
    }
  ];

  let pageOption: boolean | {} = false;
  if (remains.length > 500) {
    pageOption = { pageSize: 500 };
  }

  // tslint:disable-next-line:max-classes-per-file
  class MatTable extends Table<MatGrpExpand> {}

  return (
    <div>
      {`分组-${remains[0].label}`}
      <MatTable
        size="middle"
        dataSource={remains}
        columns={columns}
        rowKey={record => record.invCode}
        pagination={pageOption}
      />
    </div>
  );
}

export default CategoryDetails;
