import * as React from 'react';

import { Button, DatePicker, message, Spin } from 'antd';

import * as moment from 'moment';

import rawDataSvc, { POItemsData } from '../services/rawData';
import chartUtils from '../utils/chartUtils';

import {
  MatPriceInfo,
  VarBreakDetails,
  VarBreakDetailsProps,
  VarCat,
  VarHist,
  VarHistProps
} from '../components/MatPriceVar';

import {
  MatDetails,
  MatDetailsProps,
  POItem
} from '../components/MatAmtCluster';

const { RangePicker } = DatePicker;
const { round, dateFormat } = chartUtils;

// 分析查询期间内，最高价格、最低价格 的 变动百分比
// 对 变动百分比 进行分组，下钻到 每个分组内 料号数量、金额；再下钻到 具体的物料

// MatPriceVar: 本月采购的物料中，有多少是12个月内重复采购的；这些重复采购的，占当月的金额比例多少等；
interface MatPriceVarState {
  isLoading: boolean;

  // 选中期间：
  paramRange: [moment.Moment, moment.Moment];

  // 期间内采购订单行项目
  items: POItem[];

  // 按料号汇总的结果
  // [{invCode, items, minPrice, minDate, minPO, maxPrice, maxDate, maxPO, varPect, varCat}]
  byMat: MatPriceInfo[];

  // 按照价格波动汇总的结果
  // [{varCat, count}]
  byVarCat: VarCat[];
  // 当前选中的波动档次
  selectedCat: number;

  // 当前选中的物料
  selectedMat: string;
}
// tslint:disable-next-line:max-classes-per-file
class MatPriceVar extends React.Component<{}, MatPriceVarState> {
  constructor(props: {}) {
    super(props);

    const end = moment().add(1, 'days');
    const start = moment().add(-1, 'years');

    this.state = {
      isLoading: false,

      // 选中期间：
      paramRange: [start, end],

      // 期间内采购订单行项目
      items: [] as POItem[],

      // 按料号汇总的结果
      // [{invCode, items, minPrice, minDate, minPO, maxPrice, maxDate, maxPO, varPect, varCat}]
      byMat: [] as MatPriceInfo[],

      // 按照价格波动汇总的结果
      // [{varCat, count}]
      byVarCat: [] as VarCat[],
      // 当前选中的波动档次
      selectedCat: 0,

      // 当前选中的物料
      selectedMat: ''
    };
  }

  // 受控：选择期间
  private onParamRangeChange = (range: [moment.Moment, moment.Moment]) => {
    this.setState({
      paramRange: range
    });
  };

  // 选中某一个的档次
  private onVarCatChange = (varCat: number) => () => {
    // console.log('varCat: ', varCat);
    this.setState({
      selectedCat: varCat,
      selectedMat: ''
    });
  };

  // 选中某个料号
  private onMatChange = (invCode: string) => () => {
    // console.log('invCode: ', invCode);
    this.setState({
      selectedMat: invCode
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
      const byMat = this.calcMatVariance(data.items);
      const byVarCat = this.groupByVarCat(byMat);

      this.setState({
        items: data.items,
        byMat,
        byVarCat,
        selectedCat: 0,
        selectedMat: '',
        isLoading: false
      });
      message.success('数据已更新');
    } else {
      this.setState({ isLoading: false });
      message.info('无数据可更新');
    }
  };

  // 计算每颗料的最高价，最低价，变动比例，以及比例对应的 category
  private calcMatVariance = (items: POItem[]) => {
    // distinct invCode
    const r: string[] = [];
    const distInv = items.reduce((acc, curr) => {
      const exist = acc.find(a => a === curr.invCode);
      if (exist === undefined) {
        acc.push(curr.invCode);
      }
      return acc;
    }, r);

    // 读取每个料号的采购订单行项目；
    // 取得最大值，最小值，计算价格波动
    const invList: MatPriceInfo[] = distInv
      .map(invCode => {
        const list = items.filter(i => i.invCode === invCode);
        return {
          invCode,
          items: list
        };
      })
      .map(i => {
        const { items: poItems } = i;

        // 第一个为基准
        const first = poItems[0];
        // 取得最高价，最低价
        const varData = poItems.reduce(
          (acc, curr) => {
            // 当前价格不为零时，比较最高价，最低价
            if (curr.unitPrice !== 0) {
              if (curr.unitPrice < acc.minPrice) {
                acc.minPrice = curr.unitPrice;
                acc.minDate = curr.poDate;
                acc.minPO = curr.poCode;
              } else if (curr.unitPrice > acc.maxPrice) {
                acc.maxPrice = curr.unitPrice;
                acc.maxDate = curr.poDate;
                acc.maxPO = curr.poCode;
              }
            }
            return acc;
          },
          {
            minPrice: first.unitPrice,
            minDate: first.poDate,
            minPO: first.poCode,
            maxPrice: first.unitPrice,
            maxDate: first.poDate,
            maxPO: first.poCode
          }
        );

        // 判断涨价，还是降价
        const priceDown = varData.minDate > varData.maxDate ? true : false;

        // 计算变动比例
        let varPect = 0;
        if (priceDown) {
          varPect = round(
            (varData.maxPrice - varData.minPrice) / varData.maxPrice * 100
          );
        } else {
          varPect = round(
            (varData.maxPrice - varData.minPrice) / varData.minPrice * 100
          );
        }

        // 对百分百进行分组
        const labels = [
          0.1,
          0.5,
          1,
          3,
          5,
          10,
          20,
          30,
          50,
          100,
          300,
          500,
          500000
        ];
        let varCat = labels.find(c => varPect <= c);
        if (varCat === undefined) {
          varCat = 0;
        }

        // 调整正负号
        if (priceDown) {
          varPect = -1 * varPect;
          varCat = -1 * varCat;
        }

        // 每个料号的返回结果
        return {
          ...i,
          ...varData,
          varPect,
          varCat
        };
      });

    return invList;
  };

  // 按照 category 进行汇总
  private groupByVarCat = (items: MatPriceInfo[]) => {
    const r: VarCat[] = [];
    const results = items.reduce((acc, curr) => {
      const exist = acc.find(a => a.varCat === curr.varCat);
      if (exist === undefined) {
        acc.push({
          varCat: curr.varCat,
          count: 1
        });
      } else {
        exist.count += 1;
      }
      return acc;
    }, r);

    results.sort((a, b) => b.varCat - a.varCat);

    return results;
  };

  public render() {
    const {
      paramRange,
      isLoading,
      items,
      byMat,
      byVarCat,
      selectedCat,
      selectedMat
    } = this.state;

    // 按波动档次显示
    const varProps: VarHistProps = {
      items: byVarCat,
      onVarCatChange: this.onVarCatChange
    };

    // 某个档次内的详情
    const dtlProps: VarBreakDetailsProps = {
      varCat: selectedCat,
      items: byMat.filter(i => i.varCat === selectedCat),
      onMatChange: this.onMatChange
    };

    const matProps: MatDetailsProps = {
      items: items.filter(i => i.invCode === selectedMat)
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
        {items.length > 0 ? <VarHist {...varProps} /> : ''}
        {selectedCat !== 0 ? <VarBreakDetails {...dtlProps} /> : ''}
        {selectedMat !== '' ? <MatDetails {...matProps} /> : ''}
      </div>
    );
  }
}

export default MatPriceVar;
