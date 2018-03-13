// import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { BOMComp, InvRelation } from './types';

// 按照复用度显示的直方图，选中 某一个级别 后，显示该级别下的 料号清单（料号，复用次数）
// 在 料号清单 中选中 一颗料，显示 使用这颗料的所有母件 清单；

// 显示某个 grade 内的明细
export interface GradeDetailsProps {
  // 当前选中等级
  grade: number;
  // 该等级中的 料号清单，以及每个料的直接父级
  items: InvRelation[];

  // 当前选中的料号
  invCode: string;

  // 选中料号处理程序
  onSelectChild: (invCode: string) => () => void;

  // 选中母件时处理程序
  onSelectParent: (invCode: string) => () => void;
}
function GradeDetails({
  grade,
  items,
  invCode,
  onSelectChild,
  onSelectParent
}: GradeDetailsProps) {
  if (items.length === 0) {
    return <div />;
  }

  const columns: Array<ColumnProps<InvRelation>> = [
    {
      title: '子件号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 150
    },
    {
      title: '子件名称',
      dataIndex: 'invName',
      key: 'invName',
      width: 200,
      render: (text, record) => record.relations[0].childName
    },
    {
      title: '复用次数',
      dataIndex: 'count',
      key: 'count',
      width: 50,
      render: (text, record) => (
        <a onClick={onSelectChild(record.invCode)}> {text} </a>
      )
    }
  ];

  // tslint:disable-next-line:max-classes-per-file
  // class ItemTable extends Table<GradeInfo> {}
  const msg = `复用 ${grade} 次的子件清单：`;
  const childTag = (
    <div>
      <b>{msg}</b>
      <Table
        size="small"
        dataSource={items}
        columns={columns}
        rowKey="invCode"
        scroll={{ y: 300 }}
        pagination={false}
      />
    </div>
  );

  let showParent = false;
  let parentTag = <div />;
  const selected = items.find(i => i.invCode === invCode);
  if (selected !== undefined) {
    // 传入了有效的料号，显示这个料号的直接上级
    showParent = true;

    const parents = selected.relations;
    const cols: Array<ColumnProps<BOMComp>> = [
      {
        title: '母件料号',
        dataIndex: 'parentInv',
        key: 'parentInv',
        width: 150,
        render: (text, record) => (
          <a onClick={onSelectParent(record.parentInv)}> {text} </a>
        )
      },
      {
        title: '母件名称',
        dataIndex: 'parentName',
        key: 'parentName',
        width: 200
      }
    ];

    // tslint:disable-next-line:max-classes-per-file
    class ParentTable extends Table<BOMComp> {}
    const info = `${invCode}  ${parents[0].childName} 的父级组件：`;
    parentTag = (
      <div>
        <b>{info}</b>
        <ParentTable
          size="small"
          dataSource={parents}
          columns={cols}
          rowKey="parentInv"
          scroll={{ y: 300 }}
          pagination={false}
        />
      </div>
    );
  }

  const result = showParent ? (
    <Row>
      <Col span={14}>{childTag}</Col>
      <Col span={10}>{parentTag}</Col>
    </Row>
  ) : (
    childTag
  );

  return result;
}

export default GradeDetails;
