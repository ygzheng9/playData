import { MatMonthInfo, MonthMatItem } from '../MatAmtCluster';

// 选中表格中的某个单元格 (月份, 新/消亡物料数量) 后明细信息
export interface CellDetailType {
  // 业务月份
  bizMonth: string;

  // 料号
  invCode: string;
  qty: number;
  amt: number;
  amtPect: number;
}

// 按照表格显示明细数据
export interface BaseProps {
  title: string;
  baseMonths: string[];
  pivotData: any[];
  clickCell: (month: string, rowHead: string) => () => void;
}

export const RowHeadMat = '料号';

// MonthNewMat 当前月份，总金额，料号，重复的金额，料号
export interface MonthNewMat {
  bizMonth: string;
  details: MonthMatItem[];
  totalAmt: number;
  totalCnt: number;

  // bizMonth 偏移月的新物料信息
  newList: NewMatInfo[];
}

// NewMatInfo 累计偏移内，重复出现的料号，以及 新料号占比；
export interface NewMatInfo {
  // 偏移量；
  offset: number;

  // 在累计偏移量内，出现的料号清单
  occuredList: MatMonthInfo[];

  // 累计偏移内，新料号的占比（累计偏移月份内，未出现的料号，占基准月比例）
  newPect: number;
}
