import request from "../utils/request";

export default {
  sayHello: () => {
    return request("/api/hello");
  },

  // 按照开始时间，结束时间，加载行项目
  getPOItems: param => {
    return request("/api/poItems", {
      method: "POST",
      body: JSON.stringify(param)
    });
  },

  // 加载月度物料信息
  getMatByMonth: () => {
    return request("/api/matByMonth")
  }
};
