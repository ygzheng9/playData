import * as React from 'react';

import { Col, Row, Table } from 'antd';
// tslint:disable-next-line:no-submodule-imports
import { ColumnProps } from 'antd/lib/table';

import * as chartjs from 'chart.js';
import { ChartData, Line, Pie } from 'react-chartjs-2';

import chartUtils from '../../utils/chartUtils';

import { POItem, VendorGrp } from './types';

const { chartColors, chartColorsArr, round } = chartUtils;

// 某一个选定的料号：供应商占比分析，采购订单单价/数量 趋势；

// 选中一颗料后 ，显示该物料不同供应商的金额占比
// 如果只有一个供应商，则不显示；
// items: 采购订单行项目，是按照料号过滤后的结果
function MatVendorPect({ items }: MatDetailsProps) {
  if (items === undefined) {
    return <div />;
  }

  // 按供应商汇总
  const byVendor: VendorGrp[] = items.reduce(
    (acc, curr) => {
      const exist = acc.find(a => a.vendorCode === curr.vendorCode);
      if (exist === undefined) {
        acc.push({
          vendorCode: curr.vendorCode,
          amount: curr.totalAmt,
          quantity: curr.quantity,
          pect: 0,
          seqNo: 0
        });
      } else {
        exist.amount += curr.totalAmt;
        exist.quantity += curr.quantity;
      }
      return acc;
    },
    [] as VendorGrp[]
  );

  // 有多个供应商时，则显示 pie
  let pieTag = <div />;
  if (byVendor.length > 1) {
    const ttlAmt = byVendor.reduce((acc, curr) => {
      return acc + curr.amount;
    }, 0);

    const byVendorPect: VendorGrp[] = byVendor.map((i, idx) => ({
      ...i,
      pect: round(i.amount / ttlAmt * 100),
      seqNo: idx + 1
    }));

    // pie 参数
    const chartData: ChartData<chartjs.ChartData> = {
      labels: byVendor.map(i => i.vendorCode),
      datasets: [
        {
          data: byVendorPect.map(i => i.pect),
          backgroundColor: byVendor.map((_, idx) => chartColorsArr[idx % 7])
        }
      ]
    };
    const chartOptions: chartjs.ChartOptions = {
      title: {
        display: true,
        text: '供应商占比分析'
      },
      responsive: true
    };

    const columns: Array<ColumnProps<VendorGrp>> = [
      {
        title: '#',
        dataIndex: 'seqNo',
        key: 'seqNo'
      },
      {
        title: '供应商',
        dataIndex: 'vendorCode',
        key: 'vendorCode'
      },
      {
        title: '份额%',
        dataIndex: 'pect',
        key: 'pect'
      }
    ];

    // tslint:disable-next-line:max-classes-per-file
    class PectTable extends Table<VendorGrp> {}

    pieTag = (
      <Row>
        <Col span={12}>
          <Pie data={chartData} options={chartOptions} />
        </Col>
        <Col span={12}>
          <PectTable
            size="middle"
            dataSource={byVendorPect}
            columns={columns}
            rowKey={record => record.vendorCode}
            pagination={false}
          />
        </Col>
      </Row>
    );
  }

  return byVendor.length > 1 ? pieTag : <div />;
}

// 选中一颗料后，显示该物料的采购历史趋势，订单号，单价，数量；
// 两个轴：左边 单价；右边 数量；
function MatPriceTrend({ items }: MatDetailsProps) {
  if (items === undefined) {
    return <div />;
  }

  const chartData: ChartData<chartjs.ChartData> = {
    labels: items.map(i => `${i.poDate} ${i.poCode}`),
    datasets: [
      {
        label: '单价',
        borderColor: chartColors.red,
        backgroundColor: chartColors.red,
        data: items.map(i => i.unitPrice),
        yAxisID: 'y-axis-unitPrice',
        fill: false
      },
      {
        label: '数量',
        borderColor: chartColors.blue,
        backgroundColor: chartColors.blue,
        data: items.map(i => i.quantity),
        yAxisID: 'y-axis-qty',
        fill: false
      }
    ]
  };
  const chartOptions: chartjs.ChartOptions = {
    responsive: true,
    hover: { mode: 'index' },
    title: {
      display: true,
      text: '采购价格行为分析'
    },
    scales: {
      xAxes: [
        {
          display: true,
          scaleLabel: {
            display: true,
            labelString: '采购订单'
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
          id: 'y-axis-unitPrice',
          scaleLabel: {
            display: true,
            labelString: '采购单价'
          }
        },
        {
          type: 'linear',
          display: true,
          position: 'right',
          id: 'y-axis-qty',

          scaleLabel: {
            display: true,
            labelString: '采购量'
          },

          // grid line settings
          gridLines: {
            drawOnChartArea: false // only want the grid lines for one axis to show up
          }
        }
      ]
    }
  };

  const lineTag = (
    <Line data={chartData} options={chartOptions} width={600} height={300} />
  );

  const columns: Array<ColumnProps<POItem>> = [
    {
      title: '日期',
      dataIndex: 'poDate',
      key: 'poDate'
    },
    {
      title: '单号',
      dataIndex: 'poCode',
      key: 'poCode'
    },
    {
      title: '料号',
      dataIndex: 'invCode',
      key: 'invCode'
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice'
    }
  ];
  // tslint:disable-next-line:max-classes-per-file
  class PriceTable extends Table<POItem> {}
  const tblTag = (
    <PriceTable
      size="small"
      dataSource={items}
      columns={columns}
      rowKey={record => record.itemID}
      pagination={false}
    />
  );

  return (
    <Row>
      <Col>{lineTag}</Col>
      <Row />
      <Col>{tblTag}</Col>
    </Row>
  );
}

// items: 某一颗料的采购订单行项目
// 如果有多个供应商，则显示占比图；如果只有一个供应商，则不显示；
// 按照采购订单粒度，显示单价和采购量
export interface MatDetailsProps {
  items: POItem[] | undefined;
}

function MatDetails({ items }: MatDetailsProps) {
  if (items === undefined) {
    return <div />;
  }

  const props = {
    items: items.sort((a, b) => {
      // 按照订单日期排序
      if (a.poDate > b.poDate) {
        return 1;
      } else if (a.poDate === b.poDate) {
        return 0;
      } else {
        return -1;
      }
    })
  };

  return (
    <div>
      <MatVendorPect {...props} />
      <MatPriceTrend {...props} />
    </div>
  );
}

export default MatDetails;
