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
