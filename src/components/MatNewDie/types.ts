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
