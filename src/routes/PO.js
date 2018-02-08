import React from "react";
import { Table, Button, Spin, DatePicker, Row, Col, message } from "antd";
import { connect } from "dva";
import { Line, Pie } from "react-chartjs-2";
import moment from "moment";

import rawDataSvc from "../services/rawData";

const { RangePicker } = DatePicker;
const dateFormat = "YYYY-MM-DD";

// 颜色
const chartColors = {
  red: "rgb(255, 99, 132)",
  orange: "rgb(255, 159, 64)",
  yellow: "rgb(255, 205, 86)",
  green: "rgb(75, 192, 192)",
  blue: "rgb(54, 162, 235)",
  purple: "rgb(153, 102, 255)",
  grey: "rgb(201, 203, 207)"
};

const chartColorsArr = [
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(201, 203, 207)"
];


// 保留两位小数
function round(num) {
  return Math.round(num * 100) / 100;
}

// 采购金额集中度分析
// items: 每个物料的采购金额，按照金额从大到小排序，累计占比有标记
function RenderAmtAcc({ items, onSelectGroup }) {
  // 根据每个物料的采购金额，计算物料金额集中度；
  // 也即：金额从高到底排序后，前 10% 有多少颗料；10~20% 有多少颗料； 20~30% 有多少颗料；
  // 分级标记，在传入参数中已经有了，这里只是按标记，进行汇总数量；
  const byLabel = () => {
    // 对每个类型进行计数
    // reduce 之后的结果是：label, count, amount / 每个分组，分组内的数量，分组内的金额
    const c = items.reduce((acc, curr) => {
      const exist = acc.find(a => a.label === curr.label);
      if (exist === undefined) {
        acc.push({
          label: curr.label,
          count: 1,
          amount: curr.totalAmt
        });
      } else {
        exist.count += 1;
        exist.amount += curr.totalAmt;
      }
      // reduce 一定要返回一个值，作为 acc；
      return acc;
    }, []);


    // 计算每档的累计金额
    // 增加: accAmt
    let t = [];
    c.forEach((i, idx) => {
      let accAmt = i.amount;
      if (idx !== 0) {
        accAmt += t[idx - 1].accAmt;
      }
      t.push({...i, accAmt});
    });

    // 计算累计占比
    // 计算总金额
    const ttl = items.reduce((acc, curr) => acc + curr.totalAmt, 0);
    // 增加：accPect, seqNo
    const results = t.map((i, idx) => ({
        ...i,
        accPect: round(i.accAmt / ttl * 100),
        seqNo: idx + 1
    }));

    return results;
  };

  const inputs = byLabel();

  // 柱状图所需数据
  const chartData = {
    labels: inputs.map(i => i.label),
    datasets: [
      {
        label: "料号数量（log2）",
        backgroundColor: chartColors.red,
        borderColor: chartColors.red,
        fill: false,
        // 因为数量相差太大，为了优化显示，这里取 log2
        data: inputs.map(i => round(Math.log2(i.count)))
      }
    ]
  };

  // 柱状图参数：图的 title，tooltip，横纵坐标 title
  const chartOptions = {
    responsive: true,
    title: {
      display: true,
      text: "采购金额集中度分析"
    },
    tooltips: {
      mode: "index",
      intersect: false
    },
    hover: {
      mode: "nearest",
      intersect: true
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: "% 累计金额"
          }
        }
      ],
      yAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: "料号数量（log2）"
          }
        }
      ]
    }
  };

  // 表格所需数据
  const columns = [
    {
      title: "#",
      dataIndex: "seqNo",
      key: "seqNo"
    },
    {
      title: "分组",
      dataIndex: "label",
      key: "label"
    },
    {
      title: "组内料号",
      dataIndex: "count",
      key: "count",
      render: (text, record) => {
        return (
          <a onClick={onSelectGroup(record.label)}>
            {text}
          </a>
        )
      }
    },
    {
      title: "累计比例",
      dataIndex: "accPect",
      key: "accPect"
    }
  ];

  return (
    <Row>
      <Col span={16}>
        <Line data={chartData} options={chartOptions} width={600} height={400} />
      </Col>
      <Col span={8}>
        <Table
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
function CategoryDetails({items, onSelectMat}) {
  const remains = items.map((i, idx) => ({...i, amtPect: round(i.amtPect), quantity: round(i.quantity), seqNo: idx + 1}))

  const columns = [
    {
      title: "#",
      dataIndex: "seqNo",
      key: "seqNo"
    },
    {
      title: "料号",
      dataIndex: "invCode",
      key: "invCode"
    },
    {
      title: "金额%",
      dataIndex: "amtPect",
      key: "amtPect"
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "次数",
      dataIndex: "lineCnt",
      key: "lineCnt",
      render: (text, record) => <a onClick={onSelectMat(record.invCode)}>{text}</a>
    },
  ]

  let pageOption = false;
  if (remains.length > 500) {
    pageOption = { pageSize: 500 };
  }

  return (
    <div>
        {`分组-${remains[0].label}`}
        <Table
        size="middle"
        dataSource={remains}
        columns={columns}
        rowKey={record => record.invCode}
        pagination={pageOption}
      />
    </div>
  );
}

// 选中一颗料后 ，显示该物料不同供应商的金额占比
// 如果只有一个供应商，则不显示；
// items: 采购订单行项目，是按照料号过滤后的结果
function MatVendorPect({items}) {
  // 按供应商汇总
  const byVendor = items.reduce((acc, curr) =>  {
    const exist = acc.find(a => a.vendorCode === curr.vendorCode)
    if (exist === undefined) {
      acc.push({
        vendorCode: curr.vendorCode,
        amount: curr.totalAmt,
        quantity: curr.quantity
      })
    } else {
      exist.amount += curr.totalAmt;
      exist.quantity += curr.quantity;
    }
    return acc;
  }, [])

  // 有多个供应商时，则显示 pie
  let pieTag = '';
  if (byVendor.length > 1) {
    const ttlAmt = byVendor.reduce((acc, curr)=> {return acc + curr.amount}, 0)
    const byVendorPect = byVendor.map((i, idx) => ({...i, pect: round(i.amount/ttlAmt * 100), seqNo: idx + 1}))

    // pie 参数
    const chartData = {
      labels: byVendor.map(i=>i.vendorCode),
      datasets:[
        {
          data: byVendorPect.map(i=>i.pect),
          backgroundColor: byVendor.map((_, idx) => chartColorsArr[idx % 7])
        }
      ]
    }
    const chartOptions = {
      title: {
        display: true,
        text: "供应商占比分析"
      },
      responsive: true
    }

    const columns = [
      {
        title: "#",
        dataIndex: "seqNo",
        key: "seqNo"
      },
      {
        title: "供应商",
        dataIndex: "vendorCode",
        key: "vendorCode"
      },
      {
        title: "份额%",
        dataIndex: "pect",
        key: "pect"
      },
    ]

    pieTag =(
    <Row>
      <Col span={12}>
        <Pie data={chartData} options={chartOptions} />
      </Col>
      <Col span={12}>
        <Table
          size="middle"
          dataSource={byVendorPect}
          columns={columns}
          rowKey={record => record.vendorCode}
          pagination={false}
        />
      </Col>
    </Row>)
  }

  return byVendor.length > 1 ? pieTag : '';
}

// 选中一颗料后，显示该物料的采购历史趋势，订单号，单价，数量；
// 两个轴：左边 单价；右边 数量；
function MatPriceTrend({items}) {
  const chartData = {
    labels: items.map(i=> `${i.poDate} ${i.poCode}`),
    datasets:[
      {
        label: "单价",
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        data: items.map(i=>i.unitPrice),
        yAxisID: "y-axis-unitPrice",
        fill: false,
      }, {
        label: "数量",
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blue,
        data: items.map(i=>i.quantity),
        yAxisID: "y-axis-qty",
        fill: false,
      }
    ]
  }
  const chartOptions = {
    responsive: true,
    hoverMode: 'index',
    stacked: false,
    title:{
        display: true,
        text:'采购价格行为分析'
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: "采购订单"
          },
          ticks: {
            display: false,
          }
        }
      ],
      yAxes: [{
          type: "linear",
          display: true,
          position: "left",
          id: "y-axis-unitPrice",
          scaleLabel: {
            display: true,
            labelString: "采购单价",
          }
      }, {
          type: "linear",
          display: true,
          position: "right",
          id: "y-axis-qty",

          scaleLabel: {
            display: true,
            labelString: "采购量",
          },

          // grid line settings
          gridLines: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
          },
      }],
    }
  }

  const lineTag = (
    <Line data={chartData} options={chartOptions} width={600} height={300} />
  );

  const columns = [
    {
      title: "日期",
      dataIndex: "poDate",
      key: "poDate"
    },
    {
      title: "单号",
      dataIndex: "poCode",
      key: "poCode"
    },
    {
      title: "料号",
      dataIndex: "invCode",
      key: "invCode"
    },
    {
      title: "数量",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "单价",
      dataIndex: "unitPrice",
      key: "unitPrice"
    },
  ]

  const tblTag = (
    <Table
    size="small"
    dataSource={items}
    columns={columns}
    rowKey={record => record.itemID}
    pagination={false} />
  )

  return (
    <Row>
      <Col>
        {lineTag}
      </Col>
    <Row>
    </Row>
      <Col>
        {tblTag}
      </Col>
    </Row>
  )
}

// items: 某一颗料的采购订单行项目
// 如果有多个供应商，则显示占比图；如果只有一个供应商，则不显示；
// 按照采购订单粒度，显示单价和采购量
function MatDetails({items}) {
  const props = {
    items,
  }

  return (
    <div>
          <MatVendorPect {...props} />
          <MatPriceTrend {...props} />
    </div>
  )
}

class POItems extends React.Component {
  constructor(props) {
    super(props);

    const end = moment().add(1, "days");
    const start = moment().add(-1, "years");

    this.state = {
      isLoading: false,
      // 采购订单行项目
      poItems: [],
      // 按料号汇总的采购订单
      byMat: [],

      paramRange: [start, end],
      // 选中的比例
      selectedLabel: '0',

      // 选中的料号
      selectedMat: '',
    };
  }

  // 受控：选择期间
  onParamRangeChange = range => {
    this.setState({
      paramRange: range
    });
  };

  // 受控，选中的分组
  onSelectGroup = (label) => () =>  {
    this.setState({
      selectedLabel: label
    })
  }

  // 受控，选中的料号
  onSelectMat = (mat) => () =>  {
    this.setState({
      selectedMat: mat
    })
  }

  onRefresh = async () => {
    this.setState({isLoading: true})

    // 根据日期过滤
    const { paramRange } = this.state;
    const param = {
      start: paramRange[0].format(dateFormat),
      end: paramRange[1].format(dateFormat)
    };

    const { data } = await rawDataSvc.getPOItems(param);
    if (data.rtnCode !== 0) {
      message.error("操作失败，请稍后重试");
      return;
    }
    if (data.items !== null) {
      const byMat = this.groupByMat(data.items)
      const accAmt = this.calMatAmtAcc(byMat)

      this.setState({
        poItems: data.items,
        byMat: accAmt,
        selectedLabel: '0',
        selectedMat: ''
      });
      message.success("数据已更新");
    } else {
      message.info("无数据可更新");
    }
    this.setState({isLoading: false})
  };

  // 在 render 中被调用，所以 内部 不能使用 setState，因为一旦使用后，就陷入了无限 render；
  groupByMat = (allItems) => {
    // 把字符串，转成数字，如果转换失败，返回零
    const parseNum = str => {
      const n = parseFloat(str);
      if (isNaN(n)) {
        return 0.0;
      }
      return n;
    };

    // 按  invCode 汇总
    const items = allItems.reduce((acc, curr) => {
      // 按 invCode 查找是否存在
      const exist = acc.find(a => a.invCode === curr.invCode);
      // 如果不存在，则在结果集中加入新元素
      if (exist === undefined) {
        acc.push({
          invCode: curr.invCode,
          totalAmt: parseNum(curr.totalAmt),
          quantity: parseNum(curr.quantity),
          lineCnt: 1
        });
      } else {
        // 如果已经存在，则更新相应的值
        exist.totalAmt += parseNum(curr.totalAmt);
        exist.quantity += parseNum(curr.quantity);
        exist.lineCnt += 1;
      }
      return acc;
    }, []);

    // 按照金额大小排序
    const results = items.sort((a, b) => b.totalAmt - a.totalAmt);

    // 增加了：totalAmt, quantity, lineCnt
    return results;
  };

  // 计算金额累计 百分比，并打上 label
  // 根据每个物料的采购金额，计算物料金额集中度；
  // 也即：金额从高到底排序后，前 10% 有多少颗料；10~20% 有多少颗料； 20~30% 有多少颗料；
  calMatAmtAcc = (items) => {
    // 计算累计金额
    let t = [];
    items.forEach((i, idx) => {
      // 第一个元素
      let accAmt = i.totalAmt;
      if (idx !== 0) {
        // 后续元素的累计 = 当前值 + 之前的累计值
        accAmt += t[idx - 1].accAmt;
      }
      t.push({...i, accAmt});
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
      predict: item => item.accPect <= celling,
      // 返回一个 分组的 label
      action: () => `${celling}`
    }));

    // 对每一颗料，进行分组，结果就是每组的 类型
    const g = p.map(i => {
      // 从分组逻辑中，找到第一个匹配的
      const s = pMap.find(m => m.predict(i));
      if (s === undefined) {
        // 没找到分组
        return { ...i, label: "100", };
      }
      // 返回: 分组label，当前的采购金额
      return { ...i, label: s.action() };
    });

    // 增加了：accAmt, accPect, label
    return g;
  };

  hasData = () => {
    const { poItems } = this.state;
    return poItems.length > 0;
  };

  render = () => {
    const { poItems, byMat, isLoading, paramRange, selectedLabel, selectedMat } = this.state;

    const accProps = {
      items: byMat,
      onSelectGroup: this.onSelectGroup,
    };

    const catProps = {
      items: byMat.filter(i=>i.label === selectedLabel),
      onSelectMat: this.onSelectMat
    }

    const byMatProps = {
      items: poItems.filter(i=>i.invCode === selectedMat)
                    .sort((a, b) => {
                        if (a.poDate > b.poDate) {
                          return 1
                        } else if (a.poDate == b.poDate) {
                          return 0
                        } else {
                          return -1
                        }
                      })
    }

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
        {selectedLabel !== '0' ? <CategoryDetails {...catProps} />  : ''}

        {selectedMat !== '' ? (<div> {selectedMat} <MatDetails {...byMatProps} /> </div>) : '' }

      </div>
    );
  };
}

export default POItems;
