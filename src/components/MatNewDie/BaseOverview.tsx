import * as R from 'ramda';

import * as React from 'react';

import { Col, Row } from 'antd';

import { MonthNewMat } from '../../routes/MatType';

import { BaseProps, RowHeadMat } from './types';

import BaseChart from './BaseChart';
import BaseTable from './BaseTable';

// 如果一颗料，在接下来 12 个月没有购买过，那么称为 物料消亡；
// 物料消亡比例 = 消亡物料的料号数量 / 基准月料号的数量
// 查看 未来 12 个月内，物料消亡 的占比趋势；

// 显示基准月的金额与料号
export interface BaseOverviewProps {
  direction: 'L' | 'R';
  baseMonthList: MonthNewMat[];
  clickCell: (month: string, rowHead: string) => () => void;
}
const BaseOverview = ({
  direction,
  baseMonthList,
  clickCell
}: BaseOverviewProps) => {
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

  const tblProps: BaseProps = {
    title,
    baseMonths,
    pivotData,
    clickCell
  };

  return (
    <div>
      <Row>
        <Col>
          <BaseChart {...tblProps} />
        </Col>
      </Row>

      <Row>
        <Col>
          <BaseTable {...tblProps} />
        </Col>
      </Row>
    </div>
  );
};

export default BaseOverview;
