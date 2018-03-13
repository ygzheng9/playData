import request from '../utils/request';

import { BOMComp } from '../components/BOMComponent';
import { MatInfo } from '../components/BOMSimilar';
import { MatMonthInfo, POItem, PoItemParam } from '../components/MatAmtCluster';

// api 返回结构
export interface POItemsData {
  data: {
    rtnCode: number;
    items?: POItem[];
    message?: string;
  };
}

// api 返回的结果
export interface MatByMonthData {
  data: {
    rtnCode: number;
    items?: MatMonthInfo[];
    message?: string;
  };
}

// api: 返回结果，单层 BOM
export interface BOMCompData {
  data: {
    rtnCode: number;
    items?: BOMComp[];
    message?: string;
  };
}

// api: 返回结果，物料基本信息
export interface MatInfoData {
  data: {
    rtnCode: number;
    items?: MatInfo[];
    message?: string;
  };
}

export default {
  sayHello: () => {
    return request('/api/hello');
  },

  // 按照开始时间，结束时间，加载行项目
  getPOItems: (param: PoItemParam): Promise<POItemsData> => {
    return request('/api/poItems', {
      method: 'POST',
      body: JSON.stringify(param)
    });
  },

  // 加载月度物料信息
  getMatByMonth: (): Promise<MatByMonthData> => {
    return request('/api/matByMonth');
  },

  // 加载单层 BOM 信息
  getBomComponent: (): Promise<BOMCompData> => {
    return request('/api/bomComponent');
  },

  // 加载物料基本信息
  getMatInfo: (): Promise<MatInfoData> => {
    return request('/api/loadMatInfo');
  }
};
