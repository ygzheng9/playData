import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';

import { BOMIntersection, MatInfo, OneLevel } from './types';

// 显示两个组件共用的子件，以及每个组件独有的子件
export interface CompareDiffProps {
  // 两个母件共用的子件
  intersection: BOMIntersection | undefined;
  // 母件 A
  oneLevelA: OneLevel | undefined;
  // 母件 B
  oneLevelB: OneLevel | undefined;
  // 物料基本信息
  matInfoList: MatInfo[];
}
function CompareDiff({
  intersection,
  oneLevelA,
  oneLevelB,
  matInfoList
}: CompareDiffProps) {
  if (
    intersection === undefined ||
    oneLevelA === undefined ||
    oneLevelB === undefined
  ) {
    return <div />;
  }

  // 根据料号，取得物料名称；
  const getInvName = (invCode: string): string => {
    const exist = matInfoList.find(m => m.invCode === invCode);
    const invName = exist === undefined ? '' : exist.invName;
    return invName;
  };

  // 表格展示的列
  interface DetailInfo {
    seqNo: number;
    invCode: string;
    invName: string;
  }

  const invMapper = (i: string, idx: number): DetailInfo => ({
    seqNo: idx + 1,
    invCode: i,
    invName: getInvName(i)
  });

  // 共用子件
  const both = intersection.both.map(invMapper);
  // 组件 A
  const compA = oneLevelA.subList.map(invMapper);
  // 组件 B
  const compB = oneLevelB.subList.map(invMapper);
  // 三个 table, 并排显示，先准备好数据
  const tblData = [
    {
      title: '共用料',
      key: 'COMM',
      invList: both
    },
    {
      title: `${oneLevelA.invCode} ${getInvName(oneLevelA.invCode)} 用料`,
      key: 'invA',
      invList: R.difference(compA, both)
    },
    {
      title: `${oneLevelB.invCode} ${getInvName(oneLevelB.invCode)} 用料`,
      key: 'invB',
      invList: R.difference(compB, both)
    }
  ];
  // 三个表格，同一个格式
  const cols = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 30
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'invName',
      key: 'invName',
      width: 120
    }
  ];

  // tslint:disable-next-line:max-classes-per-file
  class DetailTable extends Table<DetailInfo> {}

  // 生成并排的三个表格
  const tblTag = tblData.map(t => {
    const tbl = (
      <Col span={8} key={t.key}>
        <b>{t.title}</b>
        <DetailTable
          size="small"
          dataSource={t.invList}
          columns={cols}
          rowKey={record => record.invCode}
          scroll={{ y: 300 }}
          pagination={false}
        />
      </Col>
    );

    return tbl;
  });

  return <Row>{tblTag} </Row>;
}

export default CompareDiff;
