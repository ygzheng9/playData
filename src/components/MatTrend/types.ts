// MonthlyItem 某个料号在某个月，数量，金额
export interface MonthlyItem {
  bizMonth: string;
  quantity: number;
  amount: number;
}

// MonthlyDetails 某料，最近金额，每个月的数量，金额
export interface MonthlyDetails {
  invCode: string;
  items: MonthlyItem[];
  latestAmt: number;
}
