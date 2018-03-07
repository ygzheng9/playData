import * as moment from 'moment';
import * as R from 'ramda';

import * as React from 'react';

import { Button, Col, DatePicker, message, Row, Spin, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
// import { ColumnProps } from 'antd/lib/table';

import { Bar } from 'react-chartjs-2';

import rawDataSvc, { MatByMonthData } from '../services/rawData';
import chartUtils from '../utils/chartUtils';
import {
  CellDetailType,
  MatMonthInfo,
  MonthNewMat,
  NewMatInfo
} from './MatType';

const { MonthPicker } = DatePicker;
const { chartColors, round, dateFormat, monthFormat } = chartUtils;

const RowHeadMat = '料号';

// 如果一颗料，在接下来 12 个月没有购买过，那么称为 物料消亡；
// 物料消亡比例 = 消亡物料的料号数量 / 基准月料号的数量
// 查看 未来 12 个月内，物料消亡 的占比趋势；

// 显示基准月的金额与料号
interface ShowBaseMonthsProps {
  direction: 'L' | 'R';
  baseMonthList: MonthNewMat[];
  clickCell: (month: string, rowHead: string) => () => void;
}
const ShowBaseMonths = ({
  direction,
  baseMonthList,
  clickCell
}: ShowBaseMonthsProps) => {
  if (baseMonthList.length === 0) {
    return <div />;
  }

  // 对 baseMonthList 做数据透视
  // 行、列：都是固定的；
  // 行：料号，金额，偏移量1-12；
  // 列：基准月列表；

  // 先定义每行的取数逻辑
  interface RowType {
    title: string;
    // 该行的取数逻辑
    fn: (i: MonthNewMat) => number;
  }

  // 取出指定偏移量的新物料信息
  const getOffset = (offset: number) => (i: MonthNewMat): number => {
    const exist = i.newList.find(n => n.offset === offset);
    if (exist === undefined) {
      return 0;
    }
    return exist.newPect;
  };

  // 一共有 12 个偏移量，每个偏移量一行
  const offsetRows = R.range(1, 13).map(offset => {
    const itm: RowType = {
      title: `${offset}`,
      fn: getOffset(offset)
    };
    return itm;
  });

  // 除了偏移量外，还有两行；料号，金额
  const rows = [
    { title: RowHeadMat, fn: (i: MonthNewMat) => i.totalCnt },
    // { title: '金额', fn: (i: MonthNewMat) => i.totalAmt },
    ...offsetRows
  ];

  // 取出所有的基准月,作为列
  const baseMonths = baseMonthList.map(b => b.bizMonth);

  // 根据行、列，取出每个单元格信息
  // 每一行
  const pivotData = rows.map(r => {
    // 每一列
    const list = baseMonths.map(month => {
      let value = 0;
      const monthInfo = baseMonthList.find(i => i.bizMonth === month);
      if (monthInfo !== undefined) {
        value = r.fn(monthInfo);
      }
      return {
        bizMonth: month,
        value
      };
    });

    // 把 [{}, {}] 变成一个 {}，原因：table 的每一行，是一个对象，不同的 key；
    const row = list.reduce(
      (acc, curr) => {
        // 为 acc 增加属性
        acc[curr.bizMonth] = curr.value;
        return acc;
      },
      { rowHead: r.title }
    );

    return row;
  });

  // 分两部分显示: 上部分：图；下部分：表格
  // 上部分：图：左边轴：料号数量；右边：新物料比例；显示 12，9，6,3 四条曲线
  // 下部分：设置表格参数
  const title = direction === 'L' ? '物料开发分析' : '物料消亡分析';

  const tblProps = {
    title,
    baseMonths,
    pivotData,
    clickCell
  };

  return (
    <div>
      <Row>
        <Col>
          <DrawChart {...tblProps} />
        </Col>
      </Row>

      <Row>
        <Col>
          <DrawTable {...tblProps} />
        </Col>
      </Row>
    </div>
  );
};

// 按照表格显示明细数据
interface DataProps {
  title: string;
  baseMonths: string[];
  pivotData: any[];
  clickCell: (month: string, rowHead: string) => () => void;
}
function DrawTable({ title, baseMonths, pivotData, clickCell }: DataProps) {
  // table 需要的列定义
  const baseMonthCols = baseMonths.map(month => ({
    title: month,
    dataIndex: month,
    key: month,
    render: (text: number, record: any) => {
      return <a onClick={clickCell(month, record.rowHead)}> {text} </a>;
    }
  }));

  // 加上第一列
  const columns = [
    {
      title: '#',
      dataIndex: 'rowHead',
      key: 'rowHead'
    },
    ...baseMonthCols
  ];

  return (
    <Table
      size="middle"
      dataSource={pivotData}
      columns={columns}
      rowKey="rowHead"
      scroll={{ y: 300 }}
      pagination={false}
    />
  );
}

// 图
function DrawChart({ title, baseMonths, pivotData }: DataProps) {
  // pivotData 中每一元素，都是一个 object，不同的 key 对应不同的值；

  // 取得某一行的信息
  const getRow = (rowHead: string): number[] => {
    // 根据行头，取出对应行；
    const exist = pivotData.find(p => p.rowHead === rowHead);
    if (exist === undefined) {
      return [] as number[];
    }

    // 把 {} 变成 []
    // 月份 是 {} 中的 key
    const results = baseMonths.map(month => exist[month]);
    return results;
  };

  // 图表参数
  const chartData = {
    labels: baseMonths.map(i => i),
    datasets: [
      {
        type: 'line',
        label: '累计12个月',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        data: getRow('12'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '累计9个月',
        borderColor: chartColors.green,
        backgroundColor: chartColors.green,
        borderWidth: 2,
        data: getRow('9'),
        yAxisID: 'y-axis-pect',
        fill: false
      },

      {
        type: 'line',
        label: '累计6个月',
        borderColor: chartColors.orange,
        backgroundColor: chartColors.orange,
        borderWidth: 2,
        data: getRow('6'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '累计3个月',
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blue,
        borderWidth: 2,
        data: getRow('3'),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '料号数量',
        borderColor: chartColors.grey,
        backgroundColor: chartColors.grey,
        borderWidth: 2,
        data: getRow(RowHeadMat),
        yAxisID: 'y-axis-cnt',
        fill: false
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `${title}`
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
            labelString: '采购月份'
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
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-pect',
          scaleLabel: {
            display: true,
            labelString: '新料号%'
          }
        }
      ]
    }
  };
  return (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );
}

// 选中单元格后，显示单元格的明细
interface ShowDetailsProps {
  // 对应当前点击的单元格信息
  clickedMonth: string;
  clickedHead: string;
  clickedDetails: CellDetailType[];
}
function ShowDetails({
  clickedMonth,
  clickedHead,
  clickedDetails
}: ShowDetailsProps) {
  if (clickedDetails.length === 0) {
    return <div />;
  }

  const tblData = clickedDetails.map((i, idx) => ({ ...i, seqNo: idx + 1 }));

  const columns = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo',
      width: 100
    },
    {
      title: '月份',
      dataIndex: 'bizMonth',
      key: 'bizMonth',
      width: 200
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode',
      width: 200
    },
    {
      title: '采购量',
      dataIndex: 'qty',
      key: 'qty',
      width: 200
    },
    {
      title: '采购金额',
      dataIndex: 'amt',
      key: 'amt',
      width: 200
    }
    // {
    //   title: '金额占比',
    //   dataIndex: 'amtPect',
    //   key: 'amtPect'
    // }
  ];

  const msg = `${clickedMonth} - ${clickedHead}`;

  return (
    <div>
      {msg}
      <Table
        size="middle"
        dataSource={tblData}
        columns={columns}
        rowKey="invCode"
        scroll={{ y: 300 }}
        pagination={{ pageSize: 500 }}
      />
    </div>
  );
}

// 基准月的物料，在历史 n 个月内没有购买过（比如：12个月，9个月），则成为新物料；
// 同理，在未来 n 个月没有购买过(比如：12个月， 9个月)，则称为物料消亡；
// L：向历史看（时间轴向左看）
// R: 向未来看（时间轴向右看）

// 有两个分析维度：
// 一、同一个基准月，看不同 n 下的趋势；比如：未来 6 个月没有购买过的物料，12 个月没有购买过的物料；
// 二、n 相同，基准月不同；比如：都是看未来12个月没有购买的物料，比对：2016-1 到 2016-12 连续12个月是否有下降趋势；

interface MatNewProps {
  direction: 'L' | 'R';
}

// MatNew: 连续 12 个月，新物料的占比趋势；
interface MatNewState {
  isLoading: boolean;

  // 界面选中的月份；
  selectedMonth: string;

  // 基准月列表，以及基准月的新物料信息；
  baseMonthList: MonthNewMat[];

  // 对应当前点击的单元格信息
  clickedMonth: string;
  clickedHead: string;
  clickedDetails: CellDetailType[];
}

// tslint:disable-next-line:max-classes-per-file
class MatNewDieBase extends React.Component<MatNewProps, MatNewState> {
  constructor(props: MatNewProps) {
    super(props);

    this.state = {
      isLoading: false,

      // 选中月份： 2018-02
      selectedMonth: moment().format(monthFormat),
      baseMonthList: [] as MonthNewMat[],

      // 对应当前点击的单元格信息
      clickedMonth: '',
      clickedHead: '',
      clickedDetails: [] as CellDetailType[]
    };
  }

  // 受控：选择期间
  private onMonthChange = (_date: moment.Moment, dateString: string) => {
    this.setState({
      selectedMonth: dateString
    });
  };

  private onRefresh = async () => {
    this.setState({ isLoading: true });

    const { selectedMonth } = this.state;

    // 从 api 加载原始数据
    const { data }: MatByMonthData = await rawDataSvc.getMatByMonth();
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
    const allMonthInfo = data.items;

    // 根据界面选择的月份，计算所有的 baseMonths
    const months = this.genBaseMonths(selectedMonth);

    // 对每一个基准月，计算新料号比例（相对于累计偏移量）
    // TODO: sortBy
    // const sortByMonth = R.sortBy(R.prop('bizMonth'));

    const raw = R.map(this.calcNewPect(allMonthInfo), months);
    const results = raw.sort((a, b) => {
      if (a.bizMonth > b.bizMonth) {
        return 1;
      } else if (a.bizMonth === b.bizMonth) {
        return 0;
      } else {
        return -1;
      }
    });

    this.setState({
      baseMonthList: results,
      clickedDetails: [],
      clickedHead: '',
      clickedMonth: '',
      isLoading: false
    });
    message.info('数据更新完毕');
  };

  // 根据 查询月份，计算所有的 baseMonth
  private genBaseMonths = (month: string): string[] => {
    const isFuture = this.props.direction === 'R' ? true : false;

    // 选中月
    const fristDay = moment(`${month}-01`, dateFormat);

    // 参数月份，前后的 12 个月
    const r = isFuture ? R.range(0, 13) : R.range(-12, 1);

    return r.map(m =>
      moment(fristDay)
        .add(m, 'months')
        .format(dateFormat)
        .substr(0, 7)
    );
  };

  // 计算 基准月，累计偏移量内的新物料；
  // allMonthInfo: 按月汇总的物料信息；
  // baseMonth: 基准月
  private calcNewPect = (allMonthInfo: MatMonthInfo[]) => (
    baseMonth: string
  ) => {
    const isFuture = this.props.direction === 'R' ? true : false;

    // 基准月
    const fristDay = moment(`${baseMonth}-01`, dateFormat);

    // 比对的边界：和基准月距离最远的月份， 12 个月之后/前
    const farmost = isFuture ? 12 : -12;
    const farestMonth = moment(fristDay)
      .add(farmost, 'months')
      .format(dateFormat)
      .substr(0, 7);

    // 取得按月汇总的所有信息，之后再按照 基准月，比对月进行过滤；
    // 取出基准月的明细
    const baseDetails = allMonthInfo
      .filter(i => i.bizMonth === baseMonth)
      .map(i => {
        const repeated: string[] = [];
        return { ...i, repeated, times: 0 };
      });

    // 取得比对月份数据
    const compareDetails = allMonthInfo.filter(i => {
      if (isFuture) {
        return i.bizMonth > baseMonth && i.bizMonth <= farestMonth;
      } else {
        return i.bizMonth >= farestMonth && i.bizMonth < baseMonth;
      }
    });

    // 标记：基准月中的料号，在比对月中，出现的月份
    baseDetails.forEach((itm, idx) => {
      const baseInv = itm.invCode;
      compareDetails.forEach(cmp => {
        if (cmp.invCode === baseInv) {
          baseDetails[idx].repeated.push(cmp.bizMonth);
        }
      });
    });

    // 看累计，在未来 1 个月内，重复的料号；在未来2个月内，重复的俩号；在未来12个月内，重复的料号
    const r1 = isFuture ? R.range(1, 13) : R.range(-12, 0);
    const repeatList = r1.map(r => {
      // 根据偏移量，计算比对月
      const compareMonth = moment(fristDay)
        .add(r, 'months')
        .format(dateFormat)
        .substr(0, 7);

      // 基准月中的物料，在偏移量之内，出现过
      const accList = baseDetails.filter(i => {
        const exist = i.repeated.find(
          m => (isFuture ? m <= compareMonth : m >= compareMonth)
        );
        return exist !== undefined;
      });

      return {
        offset: isFuture ? r : -1 * r,
        occuredList: accList
      };
    });

    // 基准月：总金额
    const allAmt = baseDetails.map(i => i.amt);
    const totalAmt = R.sum(allAmt);

    // 基准月：总料号数
    const allInv = baseDetails.map(i => i.invCode);
    const totalCnt = R.uniq(allInv).length;

    // 计算偏移月份的新料号占比
    const newList: NewMatInfo[] = repeatList.map(n => ({
      ...n,
      newPect: round(100 * (totalCnt - n.occuredList.length) / totalCnt)
    }));

    const baseSummary: MonthNewMat = {
      bizMonth: baseMonth,
      details: baseDetails,
      totalAmt,
      totalCnt,
      newList
    };

    return baseSummary;
  };

  // 点击单元格触发
  private clickCell = (month: string, rowHead: string) => () => {
    console.log(month, rowHead);

    // 如果选中 料号，显示当月所有物料；
    // 如果选中 偏移期，显示新物料清单；

    // 找到选中的月份数据
    const { baseMonthList } = this.state;
    const clickedMonth = baseMonthList.find(b => b.bizMonth === month);
    if (clickedMonth === undefined) {
      return;
    }

    // splice 会改变原数组，所以事先需要复制一份
    const remains = [...clickedMonth.details];

    // 选中行如果是 料号，只需要显示选中月所有物料；
    // 选中行如果是 偏移量，那么需要计算新料号；
    if (rowHead !== RowHeadMat) {
      // 选中单元格的行是 偏移量
      const offset = parseInt(rowHead, 10);
      const exist = clickedMonth.newList.find(n => n.offset === offset);
      if (exist === undefined) {
        return;
      }

      // 两个列表相减，只保留新增的料号
      const { occuredList } = exist;
      occuredList.forEach(itm => {
        // remains 初始是全集，如果重复出现，就删除，最终结果是 新物料
        const idx = remains.findIndex(r => r.invCode === itm.invCode);
        if (idx < 0) {
          return;
        } else {
          remains.splice(idx, 1);
        }
      });
    }

    // 选中单元格的明细
    const list = remains.map(i => {
      const r: CellDetailType = {
        bizMonth: i.bizMonth,
        invCode: i.invCode,
        qty: i.qty,
        amt: i.amt,
        amtPect: round(100 * i.amt / clickedMonth.totalAmt)
      };
      return r;
    });

    // 金额 从 大 到 小
    const sorted = list.sort((a, b) => b.amt - a.amt);

    this.setState({
      clickedMonth: month,
      clickedHead: rowHead,
      clickedDetails: sorted
    });
  };

  public render() {
    const {
      selectedMonth,
      isLoading,
      baseMonthList,
      clickedDetails,
      clickedHead,
      clickedMonth
    } = this.state;

    const { direction } = this.props;

    const baseProps: ShowBaseMonthsProps = {
      direction,
      baseMonthList,
      clickCell: this.clickCell
    };

    const detailProps: ShowDetailsProps = {
      clickedMonth,
      clickedHead,
      clickedDetails
    };

    return (
      <div>
        <MonthPicker
          format={monthFormat}
          value={moment(selectedMonth, monthFormat)}
          onChange={this.onMonthChange}
        />
        <Button onClick={this.onRefresh}> 查询 </Button>
        <Spin spinning={isLoading} />
        <ShowBaseMonths {...baseProps} />
        <ShowDetails {...detailProps} />
      </div>
    );
  }
}

export default MatNewDieBase;
