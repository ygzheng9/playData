import * as R from 'ramda';

import * as React from 'react';

import { Col, Row } from 'antd';

import chartUtils from '../../utils/chartUtils';

import { InvRelation } from '../../routes/MatType';

import HistChart from './HistChart';
import HistTable from './HistTable';
import { HistInfo, HistProps } from './types';

const { round } = chartUtils;

// 对于 组件被复用的次数，用 直方图 + 表格 的形式展现；

export interface UsageHistProps {
  items: InvRelation[];
  onSelectGrade: (grade: number) => () => void;
}
const UsageHist = ({ items, onSelectGrade }: UsageHistProps) => {
  if (items.length === 0) {
    return <div />;
  }

  // 计算每个分组中，料号的数量
  // 数据中有的 grade
  const avlGrade = R.uniq(items.map(i => i.grade));
  // 每个 grade 中的数量
  const byGrade = avlGrade.map(g => {
    const list = items.filter(w => w.grade === g);
    const count = list === undefined ? 0 : list.length;
    return {
      grade: g,
      count
    };
  });

  // 升序排序：1,2,3,4
  const sorted = byGrade.sort((a, b) => a.grade - b.grade);
  // 计算总数
  const total = R.sum(sorted.map(s => s.count));
  // 计算当前占比
  const accCnt = sorted.map(s => ({
    ...s,
    accCount: 0
  }));

  // 计算累计数量；
  accCnt.forEach((v, idx) => {
    if (idx === 0) {
      // 第一个累计等于当前;
      accCnt[idx].accCount = accCnt[0].count;
    } else {
      // 当前累计值 = 前一个累计值 + 当前值
      const prev = idx - 1;
      accCnt[idx].accCount = accCnt[prev].accCount + accCnt[idx].count;
    }
  });

  // 根据数量，计算占比
  const accPect: HistInfo[] = accCnt.map(i => ({
    ...i,
    pect: round(100 * i.count / total),
    accPect: round(100 * i.accCount / total)
  }));

  // 准备参数
  const gradeProps: HistProps = {
    items: accPect,
    onSelectGrade
  };

  return (
    <Row>
      <Col span={16}>
        <HistChart {...gradeProps} />
      </Col>
      <Col span={8}>
        <HistTable {...gradeProps} />
      </Col>
    </Row>
  );
};

export default UsageHist;
