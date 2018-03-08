import * as R from 'ramda';

import * as React from 'react';

import { Button, Col, message, Row, Spin, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { Bar } from 'react-chartjs-2';

import chartUtils from '../utils/chartUtils';

const { chartColors, round } = chartUtils;

import rawDataSvc, { BOMCompData } from '../services/rawData';
import { BOMComp, BOMComp2, InvRelation } from './MatType';

interface CompReuseProps {
  items: InvRelation[];
  onSelectGrade: (grade: number) => () => void;
}
const CompReuse = ({ items, onSelectGrade }: CompReuseProps) => {
  if (items.length === 0) {
    return <div />;
  }

  // 计算每个分组中，料号的数量
  // 数据中有的 grade
  const avlGrade = R.uniq(items.map(i => i.grade));
  // 每个 grade 中的数量
  const byGrade = avlGrade.map(g => {
    const list = items.filter(w => w.grade === g);
    const count = list === undefined ? 0 : list.length;
    return {
      grade: g,
      count
    };
  });

  // 升序排序：1,2,3,4
  const sorted = byGrade.sort((a, b) => a.grade - b.grade);
  // 计算总数
  const total = R.sum(sorted.map(s => s.count));
  // 计算当前占比
  const accCnt = sorted.map(s => ({
    ...s,
    accCount: 0
  }));

  // 计算累计数量；
  accCnt.forEach((v, idx) => {
    if (idx === 0) {
      // 第一个累计等于当前;
      accCnt[idx].accCount = accCnt[0].count;
    } else {
      // 当前累计值 = 前一个累计值 + 当前值
      const prev = idx - 1;
      accCnt[idx].accCount = accCnt[prev].accCount + accCnt[idx].count;
    }
  });

  // 根据数量，计算占比
  const accPect: GradeInfo[] = accCnt.map(i => ({
    ...i,
    pect: round(100 * i.count / total),
    accPect: round(100 * i.accCount / total)
  }));

  // 准备参数
  const gradeProps: GradeTableProps = {
    items: accPect,
    onSelectGrade
  };

  return (
    <Row>
      <Col span={16}>
        <GradeChart {...gradeProps} />
      </Col>
      <Col span={8}>
        <GradeTable {...gradeProps} />
      </Col>
    </Row>
  );
};

// 级别，以及级别内的料号数据
interface GradeInfo {
  grade: number;
  count: number;
  // 累计数据
  accCount: number;
  // 当前比例
  pect: number;
  // 累计比例
  accPect: number;
}

interface GradeTableProps {
  items: GradeInfo[];
  onSelectGrade: (grade: number) => () => void;
}
function GradeTable({ items, onSelectGrade }: GradeTableProps) {
  if (items.length === 0) {
    return <div />;
  }

  const columns: Array<ColumnProps<GradeInfo>> = [
    {
      title: '复用次数',
      dataIndex: 'grade',
      key: 'grade',
      width: 50
    },
    {
      title: '子件数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (text, record) => (
        <a onClick={onSelectGrade(record.grade)}>{text} </a>
      )
    },
    {
      title: '占比',
      dataIndex: 'pect',
      key: 'pect',
      width: 100
    },
    {
      title: '累计占比',
      dataIndex: 'accPect',
      key: 'accPect',
      width: 100
    }
  ];

  class ItemTable extends Table<GradeInfo> {}
  return (
    <ItemTable
      size="small"
      dataSource={items}
      columns={columns}
      rowKey="grade"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );
}

// 柱状图
function GradeChart({ items }: GradeTableProps) {
  // 图表参数
  const chartData = {
    labels: items.map(i => `${i.grade}`),
    datasets: [
      {
        type: 'bar',
        label: '组件数量',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        borderWidth: 2,
        data: items.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `BOM 组件复用度分析`
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    responsive: true,
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '组件复用数量'
          },
          ticks: {
            display: true
          }
        }
      ],
      yAxes: [
        {
          type: 'linear',
          display: true,
          position: 'left',
          id: 'y-axis-cnt',
          scaleLabel: {
            display: true,
            labelString: '料号数'
          }
        }
      ]
    }
  };
  return (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );
}

// 显示某个 grade 内的明细
interface GradeDetailProps {
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
function GradeDetail({
  grade,
  items,
  invCode,
  onSelectChild,
  onSelectParent
}: GradeDetailProps) {
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

// 显示单层 BOM：母件，子件，子件共用度
interface ComponentListProps {
  items: BOMComp2[];
}
interface ComponentListState {
  selectedChild: string;
}
// tslint:disable-next-line:max-classes-per-file
class CompentList extends React.Component<
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
    const gradeProps = {
      items: parentMap,
      onSelectGrade: this.onSelectGrade
    };

    // 根据选中 grade 取得齐下的 inv list
    const currGrade = parentMap.filter(p => p.grade === selectedGrade);
    const gradeDetailProps: GradeDetailProps = {
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
        <CompReuse {...gradeProps} />
        {selectedGrade === -1 ? '' : <GradeDetail {...gradeDetailProps} />}
        {selectedParent === '' ? '' : <CompentList {...componentListProps} />}
      </div>
    );
  }
}

export default BOMComponent;
