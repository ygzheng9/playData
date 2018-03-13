// POItem 采购订单行项目
export interface POItem {
  itemID: string;
  poID: string;
  invCode: string;
  quantity: number;
  unitPrice: number;
  netAmt: number;
  taxAmt: number;
  totalAmt: number;
  projCode: string;
  projName: string;
  poCode: string;
  poDate: string;
  vendorCode: string;
  personCode: string;
}

// PoItemParam 查询条件：采购订单起止时间
export interface PoItemParam {
  start: string;
  end: string;
}

// 按料号汇总
export interface MatGrp {
  // 按料号汇总金额，数量，次数
  invCode: string;
  totalAmt: number;
  quantity: number;
  lineCnt: number;
}

// 按料号汇总后，增加的累计信息
export interface MatGrpExpand extends MatGrp {
  // 不同料，按金额从大到小排序后，累计金额
  accAmt: number;
  // 累计百分比
  accPect: number;
  // 当前物料金额百分比
  amtPect: number;

  // 当前料号对应的累计占比标签；
  label: string;

  // 序号
  seqNo: number;
}

// 按供应商汇总
export interface VendorGrp {
  vendorCode: string;
  amount: number;
  quantity: number;

  // 金额占比
  pect: number;
  seqNo: number;
}

// 按 label 汇总后的信息，包括累计金额，累计百分比
export interface LabelInfo {
  label: string;
  count: number;
  amount: number;

  // label 排序后，到当前的累计金额
  accAmt: number;
  // 累计金额百分比
  accPect: number;
  // 序号
  seqNo: number;
}

// MatMonthInfo 按 月、料号 汇总后的 金额 数量
export interface MatMonthInfo {
  bizMonth: string;
  invCode: string;
  qty: number;
  amt: number;
}

// MonthMatItem 按月、料号汇总，汇总数量，金额
export interface MonthMatItem {
  bizMonth: string;
  invCode: string;
  qty: number;
  amt: number;

  // 料号重复出现的月份（之前12个月中的哪些月份，比如；2017-01， 2017-08）
  repeated: string[];

  // 重复出现的次数；repeated.length
  times: number;
}

// MonthSummary 当前月份，总金额，料号，重复的金额，料号
export interface MonthSummary {
  bizMonth: string;
  details: MonthMatItem[];
  totalAmt: number;
  repeatAmt: number;
  repeatAmtPect: number;
  totalCnt: number;
  repeatCnt: number;
  repeatCntPect: number;
}
