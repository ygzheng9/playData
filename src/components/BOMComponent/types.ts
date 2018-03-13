// 直方图所需数据
// 级别，以及级别内的料号数据
export interface HistInfo {
  // 级别
  grade: number;
  // 级别内料号数量
  count: number;
  // 累计数据
  accCount: number;
  // 当前比例
  pect: number;
  // 累计比例
  accPect: number;
}

// 直方图 + 表格 所需的参数
export interface HistProps {
  items: HistInfo[];
  onSelectGrade: (grade: number) => () => void;
}

// 单层 BOM 信息: 子件 - 母件
export interface BOMComp {
  childInv: string;
  childName: string;
  parentInv: string;
  parentName: string;
}

// 单层 BOM 信息：增加了 子件 对应的所有不同 母件 的数量
export interface BOMComp2 extends BOMComp {
  parentCnt: number;
  parentList: BOMComp[];
}

// 组件复用性能分析：一个物料，是多少个不同  BOM 的子件，或：一个母件，下面有多少子件
export interface InvRelation {
  invCode: string;
  // invCode 的直接上级，或直接下级；
  relations: BOMComp[];

  // relations 的长度
  count: number;
  // 对应的 grade
  grade: number;
}
