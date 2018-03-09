import * as R from 'ramda';

import * as React from 'react';

import { Button, Col, message, Row, Spin, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';
import { ChartData, Pie } from 'react-chartjs-2';

import chartUtils from '../utils/chartUtils';

const { chartColorsArr, round } = chartUtils;

import rawDataSvc, { BOMCompData, MatInfoData } from '../services/rawData';
import { BOMComp, InvRelation, MatInfo } from './MatType';

import MatByLevel from '../components/bom/MatLevel';

// BOM 相似度分析
// 按照 BOM 层级进行分组：顶层 BOM，中间层 BOM，底层 BOM；

// 各层的物料：顶层 H，中间层 M，底层 L
interface MatLevelType {
  level: 'H' | 'M' | 'L';
  title: string;
  invList: string[];
}

// 显示各个层级的料号数量：饼图 + 表格
interface ShowLevelProps {
  items: MatLevelType[];
  onSelectLevel: (level: string) => () => void;
}
function ShowLevel({ items, onSelectLevel }: ShowLevelProps) {
  if (items.length === 0) {
    return <div />;
  }

  // 增加两个属性
  interface MatLevelTypeEx extends MatLevelType {
    // invList.length
    count: number;
    // count / totalCount
    pect: number;
  }

  // 计算 单个数量
  const cnt = items.map(i => ({ ...i, count: i.invList.length }));

  // 计算 总数量
  const total = R.sum(cnt.map(i => i.count));
  // 计算占比
  const mapped: MatLevelTypeEx[] = cnt.map(i => ({
    ...i,
    pect: round(100 * i.invList.length / total)
  }));

  // 饼图 + 表格
  // pie 参数
  const chartData: ChartData<chartjs.ChartData> = {
    labels: mapped.map(i => i.title),
    datasets: [
      {
        data: mapped.map(i => i.count),
        backgroundColor: mapped.map((_, idx) => chartColorsArr[idx % 7])
      }
    ]
  };
  const chartOptions: chartjs.ChartOptions = {
    title: {
      display: true,
      text: '组件结构分析'
    },
    responsive: true
  };

  const columns: Array<ColumnProps<MatLevelTypeEx>> = [
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level'
    },
    {
      title: '描述',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) =>
        record.level === 'L' ? (
          <span> {text} </span>
        ) : (
          <a onClick={onSelectLevel(record.level)}>{text}</a>
        )
    },
    {
      title: '占比',
      dataIndex: 'pect',
      key: 'pect'
    }
  ];

  // tslint:disable-next-line:max-classes-per-file
  class LevelTable extends Table<MatLevelTypeEx> {}

  return (
    <Row>
      <Col span={12}>
        <Pie data={chartData} options={chartOptions} />
      </Col>
      <Col span={12}>
        <LevelTable
          dataSource={mapped}
          columns={columns}
          rowKey="level"
          pagination={false}
        />
      </Col>
    </Row>
  );
}

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
// tslint:disable-next-line:max-classes-per-file
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

    const levelPros: ShowLevelProps = {
      items: levelList,
      onSelectLevel: this.onSelectLevel
    };

    const invList = this.getInvByLevel(levelList, selectedLevel);

    const byLevelProps = {
      level: selectedLevel,
      invList,
      childMap,
      matInfoList
    };

    return (
      <div>
        <Button onClick={this.onRefresh}> 刷新 </Button>
        <Spin spinning={isLoading} />
        <ShowLevel {...levelPros} />
        {selectedLevel === '' ? '' : <MatByLevel {...byLevelProps} />}
      </div>
    );
  }
}

export default BOMSimilar;
