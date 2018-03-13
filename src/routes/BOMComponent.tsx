import * as R from 'ramda';

import * as React from 'react';

import { Button, message, Spin } from 'antd';

import rawDataSvc, { BOMCompData } from '../services/rawData';

import {
  BOMComp,
  BOMComp2,
  ComponentList,
  ComponentListProps,
  GradeDetails,
  GradeDetailsProps,
  InvRelation,
  UsageHist,
  UsageHistProps
} from '../components/BOMComponent';

// 对子件的复用度，首先展示 直方图 + 表格；
// 选中 直方图 中某一个级别，显示 该级别内 的子件清单（子件号，子件被复用的次数）；
// 选中 某一个子件，显示使用该子件的母件清单（母件号，母件的子件个数）；
// 选中 某一个母件，显示该母件的直接下级子件清单（子件号，复用次数）；
// 选中 某一个子件，显示使用该子件的母件清单（母件号，母件的子件个数）；

interface BOMComponentState {
  isLoading: boolean;
  items: BOMComp[];

  // 当前物料的直接上级
  parentMap: InvRelation[];

  // 当前物料的直接下级
  childMap: InvRelation[];

  // 当前选中的等级
  selectedGrade: number;
  // 当前选中的 子件
  selectedChild: string;
  // 当前选中的 母件
  selectedParent: string;
}
// tslint:disable-next-line:max-classes-per-file
class BOMComponent extends React.Component<{}, BOMComponentState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      isLoading: false,

      items: [] as BOMComp[],
      parentMap: [] as InvRelation[],
      childMap: [] as InvRelation[],

      selectedGrade: -1,
      selectedChild: '',
      selectedParent: ''
    };
  }

  private onRefresh = async () => {
    this.setState({ isLoading: true });

    // 从 api 加载原始数据
    const { data }: BOMCompData = await rawDataSvc.getBomComponent();
    if (data.rtnCode !== 0) {
      this.setState({ isLoading: false });
      message.error('操作失败，请稍后重试');
      return;
    }
    if (data.items === undefined || data.items.length === 0) {
      this.setState({ isLoading: false });
      message.info('无数据可更新');
      return;
    }
    message.info('数据已更新');

    // API 返回的结果集
    const items = data.items;

    // distinct child
    const allChild = R.uniq(items.map(i => i.childInv));
    // 取得 child 对应的 parents
    const parentMap = allChild.map(c => ({
      invCode: c,
      relations: items.filter(i => i.childInv === c),
      count: 0,
      grade: 0
    }));

    // distinct parent
    const allParent = R.uniq(items.map(i => i.parentInv));

    // 取得 parent 对应的 children
    const childMap = allParent.map(p => ({
      invCode: p,
      relations: items.filter(i => i.parentInv === p),
      count: 0,
      grade: 0
    }));

    this.setState({
      isLoading: false,
      items: data.items,
      selectedGrade: -1,
      selectedChild: '',
      selectedParent: '',
      parentMap: this.calcGrade(parentMap),
      childMap: this.calcGrade(childMap)
    });
  };

  // 按照 relations 的数量，打上 grade 标记
  private calcGrade = (items: InvRelation[]): InvRelation[] => {
    // 确定分组等级，按大小顺序排列
    const grade = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      15,
      20,
      30,
      50,
      100,
      200,
      500
    ];

    // 为每个子件，计算直接上级的数量，并分组
    const withGrade: InvRelation[] = items.map(i => {
      const count = i.relations.length;
      // 找到第一个
      let g = grade.find(a => count <= a);
      if (g === undefined) {
        // 如果超过最大设定，那么就等于最大设定
        g = 500;
      }

      return {
        ...i,
        count,
        grade: g
      };
    });

    return withGrade;
  };

  // 选中等级时触发；
  private onSelectGrade = (grade: number) => () => {
    this.setState({
      selectedGrade: grade,
      selectedChild: '',
      selectedParent: ''
    });
  };

  // 选中某一个料号（组件料号）时；
  private onSelectChild = (invCode: string) => () => {
    this.setState({
      selectedChild: invCode,
      selectedParent: ''
    });
  };

  // 选中某一个母件时；
  private onSelectParent = (invCode: string) => () => {
    this.setState({
      selectedParent: invCode
    });
  };

  public render() {
    const {
      isLoading,
      parentMap,
      selectedGrade,
      selectedChild,
      childMap,
      selectedParent
    } = this.state;
    const usageHistProps: UsageHistProps = {
      items: parentMap,
      onSelectGrade: this.onSelectGrade
    };

    // 根据选中 grade 取得齐下的 inv list
    const currGrade = parentMap.filter(p => p.grade === selectedGrade);
    const gradeDetailsProps: GradeDetailsProps = {
      grade: selectedGrade,
      items: currGrade,
      invCode: selectedChild,
      onSelectChild: this.onSelectChild,
      onSelectParent: this.onSelectParent
    };

    // 根据 selectedParent 显示母件的直接下级
    const currParent = childMap.find(i => i.invCode === selectedParent);
    // 默认是空
    let subs = [] as BOMComp2[];

    if (currParent !== undefined) {
      // 选中了 BOM 的母件
      subs = currParent.relations.map(a => {
        // 取得 子件 对应的不同 母件 数量
        let parentCnt = 0;
        let parentList = [] as BOMComp[];
        const childInv = a.childInv;
        const p = parentMap.find(b => b.invCode === childInv);
        if (p !== undefined) {
          parentCnt = p.count;
          parentList = p.relations;
        }

        const result: BOMComp2 = {
          ...a,
          parentCnt,
          parentList
        };
        return result;
      });
    }

    // 准备单层 BOM 清单的参数
    const componentListProps: ComponentListProps = {
      items: subs
    };

    return (
      <div>
        <Button onClick={this.onRefresh}> 刷新 </Button>
        <Spin spinning={isLoading} />
        <UsageHist {...usageHistProps} />
        {selectedGrade === -1 ? '' : <GradeDetails {...gradeDetailsProps} />}
        {selectedParent === '' ? '' : <ComponentList {...componentListProps} />}
      </div>
    );
  }
}

export default BOMComponent;
