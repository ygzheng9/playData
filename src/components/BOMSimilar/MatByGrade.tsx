// import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Table } from 'antd';

// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { BOMIntersection, BOMOverlap, MatInfo, OneLevel } from './types';

import CompareDiff, { CompareDiffProps } from './CompareDiff';

// 显示选中 grade 中的组件列表
export interface MatByGradeProps {
  // 当前级别
  grade: number;
  // 该级别内的物料清单
  items: BOMOverlap[];

  // 和物料清单中的物料，相关的物料
  intersections: BOMIntersection[];

  // 所有物料的下一层；
  oneLevelList: OneLevel[];

  // 物料基本信息
  matInfoList: MatInfo[];
}
interface MatByGradeState {
  isLoading: boolean;
  // 选中的物料；
  selectedInv: string;
  // 选中的比对物料；
  selectedCmp: string;
}
class MatByGrade extends React.Component<MatByGradeProps, MatByGradeState> {
  constructor(props: MatByGradeProps) {
    super(props);
    this.state = {
      isLoading: false,
      selectedInv: '',
      selectedCmp: ''
    };
  }

  public componentWillReceiveProps() {
    this.setState({
      selectedInv: '',
      selectedCmp: ''
    });
  }

  // 选中料号时触发；
  private onSelectInv = (invCode: string) => () => {
    this.setState({
      selectedInv: invCode,
      selectedCmp: ''
    });
  };

  // 选中料号时触发；
  private onSelectCmp = (invCode: string) => () => {
    this.setState({
      selectedCmp: invCode
    });
  };

  public render() {
    const { selectedInv, selectedCmp } = this.state;
    const {
      items,
      grade,
      intersections,
      oneLevelList,
      matInfoList
    } = this.props;

    if (items === undefined || items.length === 0) {
      return <div />;
    }

    // 增加物料号；
    interface BOMOverlapEx extends BOMOverlap {
      invName: string;
    }

    // 增加物料号；
    const itemsWithName: BOMOverlapEx[] = items.map(i => {
      const exist = matInfoList.find(m => m.invCode === i.invCode);
      const invName = exist === undefined ? '' : exist.invName;
      return { ...i, invName };
    });

    const columns: Array<ColumnProps<BOMOverlapEx>> = [
      {
        title: '组件号',
        dataIndex: 'invCode',
        key: 'invCode',
        width: 80
      },
      {
        title: '名称',
        dataIndex: 'invName',
        key: 'invName',
        width: 150
      },
      {
        title: '相关组件数量',
        dataIndex: 'overlap',
        key: 'overlap',
        width: 30,
        render: (text, record) => (
          <a onClick={this.onSelectInv(record.invCode)}> {text} </a>
        )
      }
    ];

    const tblTag = (
      <Table
        size="middle"
        dataSource={itemsWithName}
        columns={columns}
        rowKey="invCode"
        scroll={{ y: 300 }}
        pagination={false}
      />
    );

    // 选中一个料，显示和这颗料相关的 BOM，以及相关的料；
    // 取出当前选中 料号 的 相关联的其他料号
    const interInfo = intersections.filter(
      i => i.invA === selectedInv || i.invB === selectedInv
    );

    // (A, B, 交集) 统一变成： A 是 当前物料，B 是 相关物料
    const normolizeList: BOMIntersection[] = interInfo.map(i => {
      if (i.invA === selectedInv) {
        return { ...i };
      } else {
        return {
          ...i,
          invA: selectedInv,
          invB: i.invA
        };
      }
    });

    interface BOMIntersectionEx extends BOMIntersection {
      invName: string;
    }

    const normolizeListEx = normolizeList.map(i => {
      const exist = matInfoList.find(m => m.invCode === i.invB);
      const invName = exist === undefined ? '' : exist.invName;
      const result: BOMIntersectionEx = { ...i, invName };
      return result;
    });

    const interCols: Array<ColumnProps<BOMIntersectionEx>> = [
      {
        title: '组件号',
        dataIndex: 'invB',
        key: 'invB',
        width: 80
      },
      {
        title: '名称',
        dataIndex: 'invName',
        key: 'invName',
        width: 160
      },
      {
        title: '共用子件数量',
        dataIndex: 'count',
        key: 'count',
        width: 30,
        render: (text, record) => (
          <a onClick={this.onSelectCmp(record.invB)}> {text} </a>
        )
      }
    ];

    const interTag = (
      <Table
        size="middle"
        dataSource={normolizeListEx}
        columns={interCols}
        rowKey="invB"
        scroll={{ y: 300 }}
        pagination={false}
      />
    );

    // 选中了比对的组件
    const oneLevelA = oneLevelList.find(o => o.invCode === selectedInv);
    const oneLevelB = oneLevelList.find(o => o.invCode === selectedCmp);
    const intersection = normolizeList.find(
      n => n.invA === selectedInv && n.invB === selectedCmp
    );
    const diffProps: CompareDiffProps = {
      intersection,
      oneLevelA,
      oneLevelB,
      matInfoList
    };
    // 如果选中了对比的组件，则显示下一级子件的对比清单
    const diffTag =
      selectedCmp === '' ? (
        <div />
      ) : (
        <Row>
          <CompareDiff {...diffProps} />
        </Row>
      );

    return (
      <div>
        <Row>
          <Col span={12}>
            <b>{`相关组件数量等级 ${grade} 的组件清单：`} </b>
            {tblTag}
          </Col>
          {selectedInv === '' ? (
            ''
          ) : (
            <Col span={12}>
              <b>{`与 ${selectedInv} 有共用子件的其他母件：`} </b>
              {interTag}
            </Col>
          )}
        </Row>
        {diffTag}
      </div>
    );
  }
}

export default MatByGrade;
