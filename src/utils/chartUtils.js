// 颜色
const chartColors = {
  red: "rgb(255, 99, 132)",
  orange: "rgb(255, 159, 64)",
  yellow: "rgb(255, 205, 86)",
  green: "rgb(75, 192, 192)",
  blue: "rgb(54, 162, 235)",
  purple: "rgb(153, 102, 255)",
  grey: "rgb(201, 203, 207)"
};

const chartColorsArr = [
  "rgb(255, 99, 132)",
  "rgb(255, 159, 64)",
  "rgb(255, 205, 86)",
  "rgb(75, 192, 192)",
  "rgb(54, 162, 235)",
  "rgb(153, 102, 255)",
  "rgb(201, 203, 207)"
];


// 保留两位小数
function round(num) {
  return Math.round(num * 100) / 100;
}

const dateFormat = "YYYY-MM-DD";
const monthFormat = 'YYYY-MM';


export default {chartColors, chartColorsArr, round, dateFormat, monthFormat};
