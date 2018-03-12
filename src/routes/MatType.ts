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

// MatMonthInfo 按 月、料号 汇总后的 金额 数量
export interface MatMonthInfo {
  bizMonth: string;
  invCode: string;
  qty: number;
  amt: number;
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

// 按供应商汇总
export interface VendorGrp {
  vendorCode: string;
  amount: number;
  quantity: number;

  // 金额占比
  pect: number;
  seqNo: number;
}

// 单一料号的价格信息(料号，最高价，最低价等)，以及该料的 采购订单行项目
export interface MatPriceInfo {
  invCode: string;
  items: POItem[];
  minPrice: number;
  minDate: string;
  minPO: string;
  maxPrice: number;
  maxDate: string;
  maxPO: string;
  varPect: number;
  varCat: number;
}

// 波动档次（5%， 10%， 20%等），该档次内的料号数量
export interface VarCat {
  varCat: number;
  count: number;
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

// 新物料 选中单元格后的明细信息
export interface CellDetailType {
  bizMonth: string;
  invCode: string;
  qty: number;
  amt: number;
  amtPect: number;
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

// 物料基本信息
export interface MatInfo {
  invCode: string;
  invName: string;
  invStd: string;
  isPurchase: number;
  isSelfMade: number;
  isProxy: number;
  moQ: number;
  leadTime: number;
  fileName: string;
  version: string;
}
