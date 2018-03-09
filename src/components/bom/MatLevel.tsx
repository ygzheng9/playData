import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Spin, Table } from 'antd';

import { Bar } from 'react-chartjs-2';

// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

import { InvRelation, MatInfo } from '../../routes/MatType';

// 父级，以及直接下级
interface OneLevel {
  invCode: string;
  subList: string[];
}

// 母件，以及与之有共用子件的bom数量
interface BOMOverlap {
  invCode: string;
  overlap: number;
  grade: number;
}

// 两个母件的共用子件
interface BOMIntersection {
  invA: string;
  invB: string;
  both: string[];
  count: number;
}

// 分等级，展示 overlap
interface ShowOverlapByGradeProps {
  items: BOMOverlap[];
  onSelectGrade: (grade: number) => () => void;
}

function ShowOverlapByGrade({ items, onSelectGrade }: ShowOverlapByGradeProps) {
  // distinct grade
  const grades = R.uniq(items.map(i => i.grade));
  // group by grade
  const mapped = grades.map(g => {
    const exist = items.filter(i => i.grade === g);
    return {
      grade: g,
      count: exist === undefined ? 0 : exist.length
    };
  });

  //  按等级分类汇总
  interface GradeType {
    grade: number;
    count: number;
  }

  // 按 grade 从小到大排序
  const sorted: GradeType[] = mapped.sort((a, b) => a.grade - b.grade);

  const columns: Array<ColumnProps<GradeType>> = [
    {
      title: '相关等级',
      dataIndex: 'grade',
      key: 'grade'
    },
    {
      title: '组件数量',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => (
        <a onClick={onSelectGrade(record.grade)}> {text} </a>
      )
    }
  ];

  const tblTag = (
    <Table
      size="middle"
      dataSource={sorted}
      columns={columns}
      rowKey="grade"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );

  // 曲线图
  // 图表参数
  const chartData = {
    labels: sorted.map(i => `${i.grade}`),
    datasets: [
      {
        type: 'bar',
        label: '组件数',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        borderWidth: 2,
        data: sorted.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `组件相似度分析`
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
            labelString: '相关组件数'
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
            labelString: '组件数'
          }
        }
      ]
    }
  };

  const chartTag = (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );

  return (
    <Row>
      <Col span={16}>{chartTag}</Col>
      <Col span={8}>{tblTag}</Col>
    </Row>
  );
}

// 显示选中 grade 中的明细
interface ShowGradeProps {
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
interface ShowGradeState {
  isLoading: boolean;
  // 选中的物料；
  selectedInv: string;
  // 选中的比对物料；
  selectedCmp: string;
}
class ShowGrade extends React.Component<ShowGradeProps, ShowGradeState> {
  constructor(props: ShowGradeProps) {
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
        rowKey="invCode"
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
    const diffProps: ShowDiffProps = {
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
          <ShowDiff {...diffProps} />
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

// 显示两个组件共用的子件，以及每个组件独有的子件
interface ShowDiffProps {
  intersection: BOMIntersection | undefined;
  oneLevelA: OneLevel | undefined;
  oneLevelB: OneLevel | undefined;
  matInfoList: MatInfo[];
}
function ShowDiff({
  intersection,
  oneLevelA,
  oneLevelB,
  matInfoList
}: ShowDiffProps) {
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

  const invMapper = (i: string, idx: number) => ({
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
      invList: both
    },
    {
      title: `${oneLevelA.invCode} 用料`,
      invList: R.difference(compA, both)
    },
    {
      title: `${oneLevelB.invCode} 用料`,
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

  // 生成并排的三个表格
  const tblTag = tblData.map(t => {
    const tbl = (
      <Col span={8}>
        <b>{t.title}</b>
        <Table
          size="middle"
          dataSource={t.invList}
          columns={cols}
          rowKey="invCode"
          scroll={{ y: 300 }}
          pagination={false}
        />
      </Col>
    );

    return tbl;
  });

  return <Row>{tblTag} </Row>;
}

interface MatByLevelProps {
  level: string;
  // level 内的 invCode
  invList: string[];

  // 单层 BOM，当前物料的下一层子件
  childMap: InvRelation[];

  matInfoList: MatInfo[];
}
interface MatByLevelState {
  isLoading: boolean;
  selectedGrade: number;
}
// tslint:disable-next-line:max-classes-per-file
class MatByLevel extends React.Component<MatByLevelProps, MatByLevelState> {
  constructor(props: MatByLevelProps) {
    super(props);
    this.state = {
      isLoading: false,
      selectedGrade: -1
    };
  }

  // 选中等级时触发；
  private onSelectGrade = (grade: number) => () => {
    this.setState({
      selectedGrade: grade
    });
  };

  // 为 invList 中每个 inv，增加 子件列表
  private prepare = (): OneLevel[] => {
    const { invList, childMap } = this.props;

    const items: OneLevel[] = invList.map(inv => {
      let subList = [] as string[];
      const exist = childMap.find(c => c.invCode === inv);
      if (exist !== undefined) {
        subList = exist.relations.map(r => r.childInv);
      }

      const result: OneLevel = {
        invCode: inv,
        subList
      };

      return result;
    });

    return items;
  };

  // 根据 母件对应的子件，计算 任意两个母件 共用的子件
  private calcIntersection = (ones: OneLevel[]): BOMIntersection[] => {
    // const ones = this.prepare();
    const result = [] as BOMIntersection[];

    // 计算 上三角
    const len = ones.length;
    for (let i = 0; i < len - 1; i++) {
      const a = ones[i];
      for (let j = i + 1; j < len; j++) {
        const b = ones[j];

        // 计算 a, b 的交集
        const list = R.intersection(a.subList, b.subList);

        const point: BOMIntersection = {
          invA: a.invCode,
          invB: b.invCode,
          both: list,
          count: list.length
        };

        result.push(point);
      }
    }

    const hasCount = result.filter(i => i.count > 0);

    return hasCount;
  };

  // 计算与该BOM 与多少个BOM 有共用子件
  private calcOverlap = (intersections: BOMIntersection[]): BOMOverlap[] => {
    const { invList } = this.props;
    // const intersections = this.calcIntersection();

    const result = invList.map(inv => {
      let r = 0;
      const overlap = intersections.filter(
        i => i.invA === inv || i.invB === inv
      );
      if (overlap !== undefined) {
        r = overlap.length;
      }
      return {
        invCode: inv,
        overlap: r
      };
    });

    // 定义分组的等级
    const grades = [0, 5, 10, 20, 50, 100, 150, 200, 250, 300, 350, 500];
    const mapped = result.map(i => {
      let g = grades.find(a => a >= i.overlap);
      if (g === undefined) {
        g = 500;
      }

      return {
        ...i,
        grade: g
      };
    });

    return mapped;
  };

  public render() {
    const { matInfoList } = this.props;
    const { isLoading, selectedGrade } = this.state;

    const ones = this.prepare();
    const intersections = this.calcIntersection(ones);
    const overlap = this.calcOverlap(intersections);

    const byGradeProps = {
      items: overlap,
      onSelectGrade: this.onSelectGrade
    };

    const gradeDtl = overlap.filter(i => i.grade === selectedGrade);
    // intersections 记录的是 (A, B, 共用子件),
    // gradeDtl 中是 料号信息；
    const interInfo = intersections.filter(i => {
      const exist = gradeDtl.find(
        g => g.invCode === i.invA || g.invCode === i.invB
      );
      return exist !== undefined;
    });

    const showGradeProps: ShowGradeProps = {
      grade: selectedGrade,
      items: gradeDtl,
      intersections: interInfo,
      oneLevelList: ones,
      matInfoList
    };

    return (
      <div>
        <Spin spinning={isLoading} />
        <ShowOverlapByGrade {...byGradeProps} />

        {selectedGrade === -1 ? '' : <ShowGrade {...showGradeProps} />}
      </div>
    );
  }
}

export default MatByLevel;
