import * as React from 'react';

import { Button, Col, DatePicker, message, Row, Spin, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import { Bar } from 'react-chartjs-2';

import * as moment from 'moment';

import rawDataSvc, { MatByMonthData } from '../services/rawData';
import chartUtils from '../utils/chartUtils';
import { HistoryDetail, MonthSummary } from './MatType';

const { MonthPicker } = DatePicker;
const { chartColors, round, dateFormat, monthFormat } = chartUtils;

// TrendChart 根据每个月的数据，画图
// 每个月的采购量，这些量中，有多少是重复购买的；
interface TrendChartProps {
  items: MonthSummary[];
  selectedMonth: string;
}
function TrendChart({ items, selectedMonth }: TrendChartProps) {
  // 查看：查询月份 中的物料号，曾经在 比对月份，重复出现的次数
  const baseMonth = items.find(i => i.bizMonth === selectedMonth);
  if (baseMonth === undefined) {
    return <div />;
  }

  // 比对月份
  const revData = items.map(i => i.bizMonth).map(m => {
    // 对每一个比对月份，查询月份的物料，出现过
    const cnt = baseMonth.details.filter(
      d => d.repeated.find(r => r === m) !== undefined
    ).length;

    const pect = round(cnt / baseMonth.totalCnt * 100);

    return {
      bizMonth: m,
      baseRepeatCnt: cnt,
      baseRepectCntPect: pect
    };
  });
  // 查询月份，手工修正数据
  const baseOne = revData.find(r => r.bizMonth === selectedMonth);
  if (baseOne === undefined) {
    return <div />;
  }
  baseOne.baseRepectCntPect = baseMonth.repeatCntPect;

  // 图表参数
  const chartData = {
    labels: items.map(i => i.bizMonth),
    datasets: [
      {
        type: 'line',
        label: '料号当月%',
        borderColor: chartColors.purple,
        backgroundColor: chartColors.purple,
        borderWidth: 2,
        data: items.map(i => round(i.repeatCntPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '料号查询月%',
        borderColor: chartColors.yellow,
        backgroundColor: chartColors.yellow,
        borderWidth: 2,
        data: revData.map(i => round(i.baseRepectCntPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '总金额',
        backgroundColor: chartColors.green,
        data: items.map(i => round(i.totalAmt)),
        yAxisID: 'y-axis-amt'
      },
      {
        type: 'bar',
        label: '重复金额',
        backgroundColor: chartColors.red,
        data: items.map(i => round(i.repeatAmt)),
        yAxisID: 'y-axis-amt'
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: '物料延续性分析'
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
            labelString: '月份'
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
          id: 'y-axis-amt',
          scaleLabel: {
            display: true,
            labelString: '金额'
          }
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-pect',
          scaleLabel: {
            display: true,
            labelString: '料号数量'
          }
        }
      ]
    }
  };
  return (
    <div>
      <Bar data={chartData} options={chartOptions} width={600} height={300} />
    </div>
  );
}

// 在未来12个月中，重复在某一个月内购买的料号数量，金额；重复在两个月内购买的料号数量，金额；
interface RepeatTimesProps {
  monthData: MonthSummary | undefined;
  onRepeatTimesChange: (x: number) => () => void;
}
function RepeatTimes({ monthData, onRepeatTimesChange }: RepeatTimesProps) {
  if (monthData === undefined) {
    return <div />;
  }

  const { bizMonth, details, totalAmt, totalCnt } = monthData;

  // reduce 的结果值
  // 重复的次数，对应的料号数量，金额；数量/金额 占比
  interface ResultType {
    times: number;
    count: number;
    amount: number;

    countPect: number;
    amountPect: number;
  }
  const resInit: ResultType[] = [];

  // 每颗料，按重复次数 group，计数料号数量，金额；
  const items: ResultType[] = details
    .map(i => ({ ...i, times: i.repeated.length }))
    .sort((a, b) => a.times - b.times)
    .reduce((acc, curr) => {
      const exist = acc.find(a => a.times === curr.times);
      if (exist === undefined) {
        acc.push({
          times: curr.times,
          count: 1,
          amount: curr.amt,
          countPect: 0,
          amountPect: 0
        });
      } else {
        exist.count += 1;
        exist.amount += curr.amt;
      }
      return acc;
    }, resInit)
    .map(t => ({
      ...t,
      amount: round(t.amount),
      countPect: round(t.count / totalCnt * 100),
      amountPect: round(t.amount / totalAmt * 100)
    }));

  // 图表参数
  const chartData = {
    labels: items.map(i => `${i.times}`),
    datasets: [
      {
        type: 'line',
        label: '金额%',
        borderColor: chartColors.purple,
        backgroundColor: chartColors.purple,
        borderWidth: 2,
        data: items.map(i => round(i.amountPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'line',
        label: '料号%',
        borderColor: chartColors.yellow,
        backgroundColor: chartColors.yellow,
        borderWidth: 2,
        data: items.map(i => round(i.countPect)),
        yAxisID: 'y-axis-pect',
        fill: false
      },
      {
        type: 'bar',
        label: '料号数',
        backgroundColor: chartColors.red,
        data: items.map(i => round(i.count)),
        yAxisID: 'y-axis-cnt'
      }
    ]
  };
  const chartOptions = {
    title: {
      display: true,
      text: `${bizMonth} 物料重复购买分析`
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
            labelString: '重复次数'
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
            labelString: '%'
          }
        }
      ]
    }
  };
  const chartTag = (
    <Bar data={chartData} options={chartOptions} width={600} height={300} />
  );

  const columns: Array<ColumnProps<ResultType>> = [
    {
      title: '重复次数',
      dataIndex: 'times',
      key: 'times'
    },
    {
      title: '料号数',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => (
        <a onClick={onRepeatTimesChange(record.times)}>{text}</a>
      )
    },
    {
      title: '料号数%',
      dataIndex: 'countPect',
      key: 'countPect'
    },
    {
      title: '金额%',
      dataIndex: 'amountPect',
      key: 'amountPect'
    }
  ];

  class ItemTable extends Table<ResultType> {}
  const tableTag = (
    <ItemTable
      size="small"
      dataSource={items}
      columns={columns}
      rowKey="times"
      pagination={false}
    />
  );

  return (
    <Row>
      <Col span={16}>{chartTag}</Col>
      <Col span={8}>{tableTag}</Col>
    </Row>
  );
}

// 分 13 个月，显示每个月的购买信息
interface HistoryDetailsProp {
  items: HistoryDetail[];
}
function HistoryDetails({ items }: HistoryDetailsProp) {
  if (items.length === 0) {
    return <div />;
  }

  // 所有的物料结构都一样，所以取第一颗料即可
  const base = items[0];

  // 取出所有月份信息
  const months = base.items.map(i => i.bizMonth);

  // table 的列属性
  // 第一列为 料号；
  const columns: Array<ColumnProps<HistoryDetail>> = [
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode'
    }
  ];

  // 之后的列是月份
  months.forEach(m => {
    columns.push({
      title: m,
      dataIndex: 'invCode',
      key: m,
      render: (text, record) => {
        let qty = 0;
        // 从 array 中，按照月份，取出对应数据
        const info = record.items.find(i => i.bizMonth === m);
        if (info !== undefined) {
          qty = info.quantity;
        }
        return <div>{qty}</div>;
      }
    });
  });
  // console.log("columns: ", columns);

  // tslint:disable-next-line:max-classes-per-file
  class DetailTable extends Table<HistoryDetail> {}
  return (
    <DetailTable
      size="middle"
      dataSource={items}
      columns={columns}
      rowKey="invCode"
      pagination={false}
    />
  );
}

// MatTrend: 本月采购的物料中，有多少是12个月内重复采购的；这些重复采购的，占当月的金额比例多少等；
interface MatTrendState {
  isLoading: boolean;
  selectedMonth: string;
  monthInfo: MonthSummary[];
  repeatTimes: number;
  historyDetails: HistoryDetail[];
}
interface MatTrendProps {
  // L: 查询月，向左看，也即看历史数据；R：向右看，也即：看未来；
  direction: 'L' | 'R';
}
// tslint:disable-next-line:max-classes-per-file
class MatTrendBase extends React.Component<MatTrendProps, MatTrendState> {
  constructor(props: MatTrendProps) {
    super(props);

    this.state = {
      isLoading: false,

      // 选中月份： 2017-02
      selectedMonth: moment().format(monthFormat),

      // 每个月份的数据
      monthInfo: [] as MonthSummary[],

      // 选中的等级
      repeatTimes: -1,

      historyDetails: [] as HistoryDetail[]
    };
  }

  // 受控：选择期间
  private onMonthChange = (_date: moment.Moment, dateString: string) => {
    // console.log(date, dateString);

    this.setState({
      selectedMonth: dateString
    });
  };

  // 受控：选中重复次数
  private onRepeatTimesChange = (times: number) => () => {
    const { selectedMonth, monthInfo } = this.state;

    // 取出查询月数据；
    const baseMonth = monthInfo.find(m => m.bizMonth === selectedMonth);
    if (baseMonth === undefined) {
      return;
    }

    // 取出重复 times 的料号
    const invList = baseMonth.details
      .filter(d => d.repeated.length === times)
      .map(t => t.invCode);

    // 取出这些料，在 13 个期间的金额，数量
    const matDetails = invList
      .map(i => {
        const items = monthInfo.map(m => {
          // 准备默认的返回值
          const result = {
            bizMonth: m.bizMonth,
            amount: 0,
            quantity: 0
          };
          // 在当前月份中，按照料号查找；
          // 每个月，每个料号，只可能有一条记录（按月、料号汇总），所以直接使用 find
          // 如果找到了，更新返回值
          const exist = m.details.find(d => d.invCode === i);
          if (exist !== undefined) {
            result.amount = exist.amt;
            result.quantity = exist.qty;
          }
          return result;
        });

        // 每个料号的 map 结果
        // latestAmt: 查询月份的采购金额
        const baseItem = items.find(itm => itm.bizMonth === selectedMonth);
        return {
          invCode: i,
          items,
          latestAmt: baseItem === undefined ? 0 : baseItem.amount
        };
      })
      .sort((a, b) => b.latestAmt - a.latestAmt);

    this.setState({
      repeatTimes: times,
      historyDetails: matDetails
    });
  };

  private onRefresh = async () => {
    const { direction } = this.props;

    this.setState({ isLoading: true });

    // 计算选中月份的后12月
    const { selectedMonth } = this.state;
    const fristDay = moment(`${selectedMonth}-01`, dateFormat);
    // console.log(fristDay)
    // 格式：['2017-02', '2017-03', ...]
    const monthSegs: string[] = [];
    if (direction === 'R') {
      // 未来的 12 个月
      for (let i = 0; i <= 12; i++) {
        const t = moment(fristDay)
          .add(1 * i, 'months')
          .format(dateFormat)
          .substr(0, 7);
        monthSegs.push(t);
      }
    } else {
      // 过去的 12 个月
      for (let i = 12; i >= 0; i--) {
        const t = moment(fristDay)
          .add(-1 * i, 'months')
          .format(dateFormat)
          .substr(0, 7);
        monthSegs.push(t);
      }
    }

    const { data }: MatByMonthData = await rawDataSvc.getMatByMonth();
    if (data.rtnCode !== 0) {
      message.error('操作失败，请稍后重试');
      return;
    }
    if (data.items !== undefined && data.items.length !== 0) {
      // [{bizMonth, invCode, qty, amt}]
      const allItems = data.items;
      // console.log(allItems.length);

      // 取出每个月的记录
      const monthDetails = monthSegs.map(m => {
        // 本月的明细，
        // repeated 为该料号出现的月份；
        const oneMonth = allItems.filter(i => i.bizMonth === m).map(i => {
          const repeated = [] as string[];
          return { ...i, repeated, times: 0 };
        });

        // 本月总金额
        const totalAmt = oneMonth.reduce((acc, curr) => {
          return acc + curr.amt;
        }, 0);

        // 本月料号
        // const initArray: string[] = [];
        const totalCnt = oneMonth.map(d => d.invCode).reduce(
          (acc, curr) => {
            // distinct invCode
            const exist = acc.find(a => a === curr);
            if (exist === undefined) {
              acc.push(curr);
            }
            return acc;
          },
          [] as string[]
        ).length;

        return {
          bizMonth: m,
          details: oneMonth,
          totalAmt,
          totalCnt
        };
      });

      // 每个月和 基准月 做比较
      const tmp = monthDetails.find(m => m.bizMonth === selectedMonth);
      if (tmp === undefined) {
        return;
      }
      const base = tmp.details;

      // 为每个月，增加 重复购买的料号数 repeatCnt， 重复购买料号的金额 repeatAmt
      const results = monthDetails.map((m, idx) => {
        if (m.bizMonth !== selectedMonth) {
          // 不是查询 月份
          // 和查询月份比对相同的料号数量，以及金额
          const mds = m.details;

          // 月份中的每个物料
          const repData = mds.reduce(
            (acc, curr) => {
              // 判断：料号，是否在查询月份中
              // 由于要修改元素，所以使用 index
              const exist = base.findIndex(b => b.invCode === curr.invCode);
              if (exist !== -1) {
                // 重复料号数量
                acc.repeatCnt += 1;
                // 重复料号金额
                acc.repeatAmt += curr.amt;
                // 标记出现的月份
                base[exist].repeated.push(m.bizMonth);
              }
              return acc;
            },
            { repeatCnt: 0, repeatAmt: 0 }
          );

          return {
            ...m,
            ...repData
          };
        } else {
          // 基准月，先返回 0，后续再计算；
          return {
            ...m,
            repeatCnt: 0,
            repeatAmt: 0
          };
        }
      });

      // 对于基准月，上一步没有计算出来，这里需要再计算一次；
      // repeated 中记录的是：该物料，在后续哪些月份中有购买；
      const patch = base.reduce(
        (acc, curr) => {
          if (curr.repeated.length > 0) {
            acc.repeatCnt += 1;
            acc.repeatAmt += curr.amt;
          }
          return acc;
        },
        { repeatCnt: 0, repeatAmt: 0 }
      );

      // 需要更新的事 results 中的元素，依据是：查询月份
      const baseRes = results.find(r => r.bizMonth === selectedMonth);
      if (baseRes === undefined) {
        return;
      }
      baseRes.repeatCnt = patch.repeatCnt;
      baseRes.repeatAmt = patch.repeatAmt;

      // 对每个月，计算占比：重复购买的料号数量，重复购买的金额；
      // 对金额和比例，保留两位小数
      const repeat: MonthSummary[] = results.map(i => ({
        ...i,
        totalAmt: round(i.totalAmt),
        repeatAmt: round(i.repeatAmt),
        repeatCntPect: round(i.repeatCnt / i.totalCnt * 100),
        repeatAmtPect: round(i.repeatAmt / i.totalAmt * 100)
      }));
      // console.log("repeat: ", repeat);

      // 数据已经就绪，下面画图
      this.setState({
        monthInfo: repeat,
        isLoading: false,
        repeatTimes: -1
      });
      message.success('数据已更新');
    } else {
      this.setState({ isLoading: false });
      message.info('无数据可更新');
    }
  };

  public render() {
    const {
      selectedMonth,
      monthInfo,
      isLoading,
      repeatTimes,
      historyDetails
    } = this.state;
    // 查询月份 以及 之后 12 个月的数据
    const trendProps: TrendChartProps = {
      items: monthInfo,
      selectedMonth
    };

    // 查询月份的数据
    const repeadProps: RepeatTimesProps = {
      monthData: monthInfo.find(i => i.bizMonth === selectedMonth),
      onRepeatTimesChange: this.onRepeatTimesChange
    };

    // 重复购买信息
    const hisProps = {
      items: historyDetails
    };

    return (
      <div>
        {'看未来'}
        <MonthPicker
          format={monthFormat}
          value={moment(selectedMonth, monthFormat)}
          onChange={this.onMonthChange}
        />
        <Button onClick={this.onRefresh}> 查询 </Button>
        <Spin spinning={isLoading} />
        {monthInfo.length > 0 ? (
          <div>
            <TrendChart {...trendProps} />
            <RepeatTimes {...repeadProps} />
          </div>
        ) : (
          ''
        )}

        {repeatTimes !== -1 ? (
          <div>
            {`重复 ${repeatTimes} 个月采购的物料信息`}
            <HistoryDetails {...hisProps} />
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default MatTrendBase;
