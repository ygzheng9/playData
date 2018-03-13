import * as R from 'ramda';

import * as React from 'react';

import { Spin } from 'antd';

import { InvRelation } from '../BOMComponent';

import { BOMIntersection, BOMOverlap, MatInfo, OneLevel } from './types';

import MatByGrade, { MatByGradeProps } from './MatByGrade';
import OverlapByGrade, { OverlapByGradeProps } from './OverlapByGrade';

export interface LevelGradeProps {
  level: string;
  // level 内的 invCode
  invList: string[];

  // 单层 BOM，当前物料的下一层子件
  childMap: InvRelation[];

  matInfoList: MatInfo[];
}
interface LevelGradeState {
  isLoading: boolean;
  selectedGrade: number;
}
// tslint:disable-next-line:max-classes-per-file
class LevelGrade extends React.Component<LevelGradeProps, LevelGradeState> {
  constructor(props: LevelGradeProps) {
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
  private calcIntersection = (ones: OneLevel[]): BOMIntersection[] => {
    // const ones = this.prepare();
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
  private calcOverlap = (intersections: BOMIntersection[]): BOMOverlap[] => {
    const { invList } = this.props;
    // const intersections = this.calcIntersection();

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
    const { matInfoList } = this.props;
    const { isLoading, selectedGrade } = this.state;

    const ones = this.prepare();
    const intersections = this.calcIntersection(ones);
    const overlap = this.calcOverlap(intersections);

    const byGradeProps: OverlapByGradeProps = {
      items: overlap,
      onSelectGrade: this.onSelectGrade
    };

    const gradeDtl = overlap.filter(i => i.grade === selectedGrade);
    // intersections 记录的是 (A, B, 共用子件),
    // gradeDtl 中是 料号信息；
    const interInfo = intersections.filter(i => {
      const exist = gradeDtl.find(
        g => g.invCode === i.invA || g.invCode === i.invB
      );
      return exist !== undefined;
    });

    const showGradeProps: MatByGradeProps = {
      grade: selectedGrade,
      items: gradeDtl,
      intersections: interInfo,
      oneLevelList: ones,
      matInfoList
    };

    return (
      <div>
        <Spin spinning={isLoading} />
        <OverlapByGrade {...byGradeProps} />
        {selectedGrade === -1 ? '' : <MatByGrade {...showGradeProps} />}
      </div>
    );
  }
}

export default LevelGrade;
