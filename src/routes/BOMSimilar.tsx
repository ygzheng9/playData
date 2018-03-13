import * as R from 'ramda';

import * as React from 'react';

import { Button, message, Spin } from 'antd';

import rawDataSvc, { BOMCompData, MatInfoData } from '../services/rawData';

import { BOMComp, InvRelation } from '../components/BOMComponent';

import {
  LevelGrade,
  LevelGradeProps,
  LevelSummary,
  LevelSummaryProps,
  MatInfo,
  MatLevelType
} from '../components/BOMSimilar';

// BOM 相似度分析
// 1. 按照物料在 BOM 中的层级，分组：顶层组件，中间层组件，底层组件，饼图 + 表格 展示；
// 2. 选中某一级后，按照相关组件数量，分组显示（相关组件：两个组件有共用的子件，则相关）；
// 3. 选中某一个相关数量级别后，显示该级别内的 组件清单，以及相关组件数量；
// 4. 选中某一个组件，显示该组件的相关组件列表，以及相同子件数量；
// 5. 选中一个相关组件，显示两个组件的共用料清单，以及各自组件的专用料清单；

interface BOMSimilarState {
  isLoading: boolean;
  // 单层 BOM
  items: BOMComp[];

  // 物料基本信息
  matInfoList: MatInfo[];

  // 分层后的物料
  levelList: MatLevelType[];
  // 选中的 level
  selectedLevel: string;

  // 物料的直接下级
  childMap: InvRelation[];
}
class BOMSimilar extends React.Component<{}, BOMSimilarState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      isLoading: false,

      items: [] as BOMComp[],
      matInfoList: [] as MatInfo[],

      levelList: [] as MatLevelType[],
      selectedLevel: '',

      childMap: [] as InvRelation[]
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

    const { data: data2 }: MatInfoData = await rawDataSvc.getMatInfo();
    if (data2.rtnCode !== 0) {
      this.setState({ isLoading: false });
      message.error('操作失败，请稍后重试');
      return;
    }
    if (data2.items === undefined || data2.items.length === 0) {
      this.setState({ isLoading: false });
      message.info('无数据可更新');
      return;
    }

    // api 返回的数据
    const items = data.items;
    const levels = this.calcLevels(items);

    // distinct parent
    const allParent = R.uniq(items.map(i => i.parentInv));

    // 取得 parent 对应的 children
    const childMap = allParent.map(p => ({
      invCode: p,
      relations: items.filter(i => i.parentInv === p),
      count: 0,
      grade: 0
    }));

    message.info('数据已更新');

    this.setState({
      isLoading: false,
      items: data.items,
      matInfoList: data2.items,
      levelList: levels,
      childMap,
      selectedLevel: ''
    });
  };

  // 选中等级时触发；
  private onSelectLevel = (level: string) => () => {
    this.setState({
      selectedLevel: level
    });
  };

  // 依据 单层BOM ，拆分成：顶层物料，中间层物料，底层物料
  private calcLevels(items: BOMComp[]): MatLevelType[] {
    // 对物料分组：顶层BOM，中间层，底层；
    const parents = R.uniq(items.map(i => i.parentInv));
    const children = R.uniq(items.map(i => i.childInv));

    // 顶层：只出现在 parents 中
    const topLevel = R.difference(parents, children);
    // 底层： 只出现在 childern 中
    const lowLevel = R.difference(children, parents);
    // 中间层：同时出现在 parents 和 childer 中
    const midLevel = R.intersection(parents, children);

    const results: MatLevelType[] = [
      {
        level: 'H',
        title: '顶层组件',
        invList: topLevel
      },
      {
        level: 'M',
        title: '中间层组件',
        invList: midLevel
      },
      {
        level: 'L',
        title: '底层组件',
        invList: lowLevel
      }
    ];

    return results;
  }

  // 根据 level，取得物料
  private getInvByLevel(
    levelList: MatLevelType[],
    selectedLevel: string
  ): string[] {
    let invList = [] as string[];
    const exist = levelList.find(i => i.level === selectedLevel);
    if (exist !== undefined) {
      invList = exist.invList;
    }
    return invList;
  }

  public render() {
    const {
      isLoading,
      levelList,
      selectedLevel,
      childMap,
      matInfoList
    } = this.state;

    const levelSummaryPros: LevelSummaryProps = {
      items: levelList,
      onSelectLevel: this.onSelectLevel
    };

    const invList = this.getInvByLevel(levelList, selectedLevel);

    const levelGradeProps: LevelGradeProps = {
      level: selectedLevel,
      invList,
      childMap,
      matInfoList
    };

    return (
      <div>
        <Button onClick={this.onRefresh}> 刷新 </Button>
        <Spin spinning={isLoading} />
        <LevelSummary {...levelSummaryPros} />
        {selectedLevel === '' ? '' : <LevelGrade {...levelGradeProps} />}
      </div>
    );
  }
}

export default BOMSimilar;
