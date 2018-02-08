import React from "react";
import { Table, Button, Spin, DatePicker, Row, Col, message } from "antd";
import { connect } from "dva";
import { Line, Pie } from "react-chartjs-2";
import moment from "moment";

import rawDataSvc from "../services/rawData";

const { RangePicker } = DatePicker;

// 保留两位小数
function round(num) {
  return Math.round(num * 100) / 100;
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

export default MatDetails;
