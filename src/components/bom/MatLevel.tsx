import * as R from 'ramda';

import * as React from 'react';

import { Col, Row, Spin, Table } from 'antd';

import { Bar } from 'react-chartjs-2';

// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import chartUtils from '../../utils/chartUtils';

const { chartColors, round } = chartUtils;

import { InvRelation } from '../../routes/MatType';

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
  grade: number;
  items: BOMOverlap[];
}
function ShowGrade({ grade, items }: ShowGradeProps) {
  if (items === undefined || items.length === 0) {
    return <div />;
  }

  const columns: Array<ColumnProps<BOMOverlap>> = [
    {
      title: '组件号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 100
    },
    {
      title: '相关组件数量',
      dataIndex: 'overlap',
      key: 'overlap',
      width: 100
    }
  ];

  const tblTag = (
    <Table
      size="middle"
      dataSource={items}
      columns={columns}
      rowKey="invCode"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );

  // TODO: 选中一个料，显示和这颗料相关的 BOM，以及相关的料；

  return (
    <div>
      <b>{`相关组件数量等级 ${grade} 的组件清单：`} </b>
      {tblTag}
    </div>
  );
}

interface MatByLevelProps {
  level: string;
  // level 内的 invCode
  invList: string[];

  // 单层 BOM，当前物料的下一层子件
  childMap: InvRelation[];
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
  private calcIntersection = (): BOMIntersection[] => {
    const ones = this.prepare();
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
  private calcOverlap = (): BOMOverlap[] => {
    const { invList } = this.props;
    const intersections = this.calcIntersection();

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
    const { isLoading, selectedGrade } = this.state;

    const overlap = this.calcOverlap();

    const byGradeProps = {
      items: overlap,
      onSelectGrade: this.onSelectGrade
    };

    const gradeDtl = overlap.filter(i => i.grade === selectedGrade);
    const showGradeProps = {
      grade: selectedGrade,
      items: gradeDtl
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