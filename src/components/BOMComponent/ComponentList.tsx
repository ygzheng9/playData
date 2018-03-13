// import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { BOMComp, BOMComp2 } from './types';

// 选中 一个母件 后，显示 该母件 的直接下级子件清单
// 显示单层 BOM：母件，子件，子件共用度
export interface ComponentListProps {
  items: BOMComp2[];
}
interface ComponentListState {
  selectedChild: string;
}
// tslint:disable-next-line:max-classes-per-file
class ComponentList extends React.Component<
  ComponentListProps,
  ComponentListState
> {
  constructor(props: ComponentListProps) {
    super(props);

    this.state = {
      selectedChild: ''
    };
  }

  // 选中某一个母件时；
  private onSelectChild = (invCode: string) => () => {
    this.setState({
      selectedChild: invCode
    });
  };

  public render() {
    const { items } = this.props;
    const { selectedChild } = this.state;

    if (items.length === 0) {
      return <div />;
    }

    const columns: Array<ColumnProps<BOMComp2>> = [
      {
        title: '子件料号',
        dataIndex: 'childInv',
        key: 'childInv',
        width: 150
      },
      {
        title: '子件名称',
        dataIndex: 'childName',
        key: 'childName',
        width: 200
      },
      {
        title: '复用次数',
        dataIndex: 'parentCnt',
        key: 'parentCnt',
        width: 50,
        render: (text, record) => (
          <a onClick={this.onSelectChild(record.childInv)}>{text}</a>
        )
      }
    ];

    // tslint:disable-next-line:max-classes-per-file
    class ListTable extends Table<BOMComp> {}
    const first = items[0];
    const info = `${first.parentInv}  ${first.parentName} 的物料清单：`;
    const childTag = (
      <div>
        <b>{info}</b>
        <ListTable
          size="small"
          dataSource={items}
          columns={columns}
          rowKey="childInv"
          scroll={{ y: 300 }}
          pagination={false}
        />
      </div>
    );

    let showParent = false;
    let parentTag = <div />;
    const selected = items.find(i => i.childInv === selectedChild);
    if (selected !== undefined) {
      // 传入了有效的料号，显示这个料号的直接上级
      showParent = true;

      const parents = selected.parentList;
      const cols: Array<ColumnProps<BOMComp>> = [
        {
          title: '母件料号',
          dataIndex: 'parentInv',
          key: 'parentInv',
          width: 150
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
      const info2 = `${selectedChild}  ${parents[0].childName} 的父级组件：`;
      parentTag = (
        <div>
          <b>{info2}</b>
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
}

export default ComponentList;
