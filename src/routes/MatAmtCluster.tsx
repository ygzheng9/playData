import * as React from 'react';

import { Button, Col, DatePicker, message, Row, Spin, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';

import { ChartData, Line } from 'react-chartjs-2';

import * as moment from 'moment';

import MatDetails, { MatDetailsProps } from './MatDetails';

import rawDataSvc, { POItemsData } from '../services/rawData';
import chartUtils from '../utils/chartUtils';

import { LabelInfo, MatGrp, MatGrpExpand, POItem } from './MatType';

const { RangePicker } = DatePicker;
const { chartColors, round, dateFormat } = chartUtils;

// 采购金额集中度分析
// items: 每个物料的采购金额，按照金额从大到小排序，累计占比有标记
interface RenderAmtAccProps {
  items: MatGrpExpand[];
  onSelectGroup: (s: string) => () => void;
}
function RenderAmtAcc({ items, onSelectGroup }: RenderAmtAccProps) {
  // 根据每个物料的采购金额，计算物料金额集中度；
  // 也即：金额从高到底排序后，前 10% 有多少颗料；10~20% 有多少颗料； 20~30% 有多少颗料；
  // 分级标记，在传入参数中已经有了，这里只是按标记，进行汇总数量；
  const byLabel = (): LabelInfo[] => {
    // 对每个类型进行计数
    // reduce 之后的结果是：label, count, amount / 每个分组，分组内的数量，分组内的金额
    const c: LabelInfo[] = items.reduce(
      (acc, curr) => {
        const exist = acc.find(a => a.label === curr.label);
        if (exist === undefined) {
          acc.push({
            label: curr.label,
            count: 1,
            amount: curr.totalAmt,
            accAmt: 0,
            accPect: 0,
            seqNo: 0
          });
        } else {
          exist.count += 1;
          exist.amount += curr.totalAmt;
        }
        // reduce 一定要返回一个值，作为 acc；
        return acc;
      },
      [] as LabelInfo[]
    );

    // 计算每档的累计金额
    // 增加: accAmt
    const t: LabelInfo[] = [];
    c.forEach((i, idx) => {
      let accAmt = i.amount;
      if (idx !== 0) {
        accAmt += t[idx - 1].accAmt;
      }
      t.push({ ...i, accAmt });
    });

    // 计算累计占比
    // 计算总金额
    const ttl = items.reduce((acc, curr) => acc + curr.totalAmt, 0);

    // 增加：accPect, seqNo
    const results: LabelInfo[] = t.map((i, idx) => ({
      ...i,
      accPect: round(i.accAmt / ttl * 100),
      seqNo: idx + 1
    }));

    return results;
  };

  const inputs = byLabel();

  // 柱状图所需数据
  const chartData: ChartData<chartjs.ChartData> = {
    labels: inputs.map(i => i.label),
    datasets: [
      {
        label: '料号数量（log2）',
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        fill: false,
        // 因为数量相差太大，为了优化显示，这里取 log2
        data: inputs.map(i => round(Math.log2(i.count)))
      }
    ]
  };

  // 柱状图参数：图的 title，tooltip，横纵坐标 title
  const chartOptions: chartjs.ChartOptions = {
    responsive: true,
    title: {
      display: true,
      text: '采购金额集中度分析'
    },
    tooltips: {
      mode: 'index',
      intersect: false
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '% 累计金额'
          }
        }
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '料号数量（log2）'
          }
        }
      ]
    }
  };

  // 表格所需数据
  const columns: Array<ColumnProps<LabelInfo>> = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo'
    },
    {
      title: '分组',
      dataIndex: 'label',
      key: 'label'
    },
    {
      title: '组内料号',
      dataIndex: 'count',
      key: 'count',
      render: (text, record) => {
        return <a onClick={onSelectGroup(record.label)}>{text}</a>;
      }
    },
    {
      title: '累计比例',
      dataIndex: 'accPect',
      key: 'accPect'
    }
  ];
  // tslint:disable-next-line:max-classes-per-file
  class LabelTable extends Table<LabelInfo> {}

  return (
    <Row>
      <Col span={16}>
        <Line
          data={chartData}
          options={chartOptions}
          width={600}
          height={400}
        />
      </Col>
      <Col span={8}>
        <LabelTable
          size="middle"
          dataSource={inputs}
          columns={columns}
          rowKey={record => record.label}
          pagination={false}
        />
      </Col>
    </Row>
  );
}

// 选中了某个级别后，显示该级别下的具体明细信息
interface CategoryDetailsProps {
  items: MatGrpExpand[];
  onSelectMat: (s: string) => () => void;
}

function CategoryDetails({ items, onSelectMat }: CategoryDetailsProps) {
  const remains = items.map((i, idx) => ({
    ...i,
    amtPect: round(i.amtPect),
    quantity: round(i.quantity),
    seqNo: idx + 1
  }));

  const columns: Array<ColumnProps<MatGrpExpand>> = [
    {
      title: '#',
      dataIndex: 'seqNo',
      key: 'seqNo'
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode'
    },
    {
      title: '金额%',
      dataIndex: 'amtPect',
      key: 'amtPect'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '次数',
      dataIndex: 'lineCnt',
      key: 'lineCnt',
      render: (text, record) => (
        <a onClick={onSelectMat(record.invCode)}>{text}</a>
      )
    }
  ];

  let pageOption: boolean | {} = false;
  if (remains.length > 500) {
    pageOption = { pageSize: 500 };
  }

  // tslint:disable-next-line:max-classes-per-file
  class MatTable extends Table<MatGrpExpand> {}

  return (
    <div>
      {`分组-${remains[0].label}`}
      <MatTable
        size="middle"
        dataSource={remains}
        columns={columns}
        rowKey={record => record.invCode}
        pagination={pageOption}
      />
    </div>
  );
}

interface MatAmtClusterState {
  isLoading: boolean;
  poItems: POItem[];
  byMat: MatGrpExpand[];
  paramRange: [moment.Moment, moment.Moment];
  selectedLabel: string;
  selectedMat: string;
}

// tslint:disable-next-line:max-classes-per-file
class MatAmtCluster extends React.Component<{}, MatAmtClusterState> {
  constructor(props: {}) {
    super(props);

    const end = moment().add(1, 'days');
    const start = moment().add(-1, 'years');

    this.state = {
      isLoading: false,

      // 采购订单行项目
      poItems: [] as POItem[],

      // 按料号汇总的采购订单
      byMat: [] as MatGrpExpand[],

      paramRange: [start, end],
      // 选中的比例
      selectedLabel: '0',

      // 选中的料号
      selectedMat: ''
    };
  }

  // 受控：选择期间
  private onParamRangeChange = (range: [moment.Moment, moment.Moment]) => {
    this.setState({
      paramRange: range
    });
  };

  // 受控，选中的分组
  private onSelectGroup = (label: string) => () => {
    this.setState({
      selectedLabel: label
    });
  };

  // 受控，选中的料号
  private onSelectMat = (mat: string) => () => {
    this.setState({
      selectedMat: mat
    });
  };

  private onRefresh = async () => {
    this.setState({ isLoading: true });

    // 根据日期过滤
    const { paramRange } = this.state;
    const param = {
      start: paramRange[0].format(dateFormat),
      end: paramRange[1].format(dateFormat)
    };

    const { data }: POItemsData = await rawDataSvc.getPOItems(param);
    if (data.rtnCode !== 0) {
      message.error('操作失败，请稍后重试');
      return;
    }
    if (data.items !== undefined) {
      const list = data.items;
      const byMat = this.groupByMat(list);
      const accAmt = this.calMatAmtAcc(byMat);

      this.setState({
        poItems: list,
        byMat: accAmt,
        selectedLabel: '0',
        selectedMat: '',
        isLoading: false
      });
      message.success('数据已更新');
    } else {
      this.setState({ isLoading: false });
      message.info('无数据可更新');
    }
  };

  // 在 render 中被调用，所以 内部 不能使用 setState，因为一旦使用后，就陷入了无限 render；
  private groupByMat = (allItems: POItem[]): MatGrp[] => {
    // 按  invCode 汇总
    const items = allItems.reduce(
      (acc, curr) => {
        // 按 invCode 查找是否存在
        const exist = acc.find(a => a.invCode === curr.invCode);
        // 如果不存在，则在结果集中加入新元素
        if (exist === undefined) {
          acc.push({
            invCode: curr.invCode,
            totalAmt: curr.totalAmt,
            quantity: curr.quantity,
            lineCnt: 1
          });
        } else {
          // 如果已经存在，则更新相应的值
          exist.totalAmt += curr.totalAmt;
          exist.quantity += curr.quantity;
          exist.lineCnt += 1;
        }
        return acc;
      },
      [] as MatGrp[]
    );

    // 按照金额大小排序
    const results = items.sort((a, b) => b.totalAmt - a.totalAmt);

    // 增加了：totalAmt, quantity, lineCnt
    return results;
  };

  // 计算金额累计 百分比，并打上 label
  // 根据每个物料的采购金额，计算物料金额集中度；
  // 也即：金额从高到底排序后，前 10% 有多少颗料；10~20% 有多少颗料； 20~30% 有多少颗料；
  private calMatAmtAcc = (items: MatGrp[]): MatGrpExpand[] => {
    // 计算累计金额
    const t: MatGrpExpand[] = [];
    items.forEach((i, idx) => {
      // 第一个元素
      let accAmt = i.totalAmt;
      if (idx !== 0) {
        // 后续元素的累计 = 当前值 + 之前的累计值
        accAmt += t[idx - 1].accAmt;
      }
      t.push({ ...i, accAmt, accPect: 0, amtPect: 0, label: '0', seqNo: 0 });
    });

    // 计算累计金额占比（相对于总金额）
    // 计算总金额
    const ttl = items.reduce((acc, curr) => acc + curr.totalAmt, 0);

    const p = t.map(i => ({
      ...i,
      // 累计百分百
      accPect: i.accAmt / ttl * 100,
      // 当前百分比
      amtPect: i.totalAmt / ttl * 100
    }));

    // 对 累计占比 分组，10%，20%，30%，50%，80%，100%，每组中显示物料的个数

    // 设置分组逻辑，也即：每个组的边界
    const segs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const pMap = segs.map((celling, idx) => ({
      // 这里只判断上限，因为在使用时，使用的是 find，也即：第一个满足的条件就退出，后续不进行匹配
      predict: (item: MatGrpExpand) => item.accPect <= celling,
      // 返回一个 分组的 label
      action: () => `${celling}`
    }));

    // 对每一颗料，进行分组，结果就是每组的 类型
    const g = p.map(i => {
      // 从分组逻辑中，找到第一个匹配的
      const s = pMap.find(m => m.predict(i));
      if (s === undefined) {
        // 没找到分组
        return { ...i, label: '100' };
      }
      // 返回: 分组label，当前的采购金额
      return { ...i, label: s.action() };
    });

    // 增加了：accAmt, accPect, label
    return g;
  };

  private hasData = () => {
    const { poItems } = this.state;
    return poItems.length > 0;
  };

  public render() {
    const {
      poItems,
      byMat,
      isLoading,
      paramRange,
      selectedLabel,
      selectedMat
    } = this.state;

    const accProps: RenderAmtAccProps = {
      items: byMat,
      onSelectGroup: this.onSelectGroup
    };

    const catProps: CategoryDetailsProps = {
      items: byMat.filter(i => i.label === selectedLabel),
      onSelectMat: this.onSelectMat
    };

    const byMatProps: MatDetailsProps = {
      items: poItems.filter(i => i.invCode === selectedMat)
    };

    return (
      <div>
        <RangePicker
          value={paramRange}
          format={dateFormat}
          onChange={this.onParamRangeChange}
        />
        <Button onClick={this.onRefresh}> 查询 </Button>
        <Spin spinning={isLoading} />

        {this.hasData() ? <RenderAmtAcc {...accProps} /> : ''}
        {selectedLabel !== '0' ? <CategoryDetails {...catProps} /> : ''}

        {selectedMat !== '' ? (
          <div>
            {' '}
            {selectedMat} <MatDetails {...byMatProps} />{' '}
          </div>
        ) : (
          ''
        )}
      </div>
    );
  }
}

export default MatAmtCluster;
