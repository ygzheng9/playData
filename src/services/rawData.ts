import request from '../utils/request';

import { MatMonthInfo, POItem, PoItemParam } from '../routes/MatType';

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
  }
};