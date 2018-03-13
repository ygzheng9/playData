import { POItem } from '../MatAmtCluster';

// 采购单价 波动档次（5%， 10%， 20%等），该档次内的料号数量
export interface VarCat {
  varCat: number;
  count: number;
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
