# playData

## 采购集中度分析
1. 期间内物料，按金额从高到低排序；

2. 以 10% 为一档，计算每档内的料号数量；

   1. 曲线图：由于料号数量急速膨胀，所以曲线图中，采取了 log2；
   2. 表格：组标签，组内料号数，采购金额累计占比；

3. 下钻：选中某一档后，

   1. 表格：显示该档内的料号清单，每颗料对应的采购金额，采购量，以及采购频次；

4. 下钻：再次选中某一颗料后（点击某颗料的采购频次），

   1. 饼图：期间内，多个供应商的各自采购金额占比；

   2. 曲线图：以采购订单为粒度，按照时间，显示该物料的采购单价，采购数量；

   3. 表格：采购订单列表；

      ​

## 物料延续性分析（L/R）
1. 以查询月份的采购物料为基准，比对历史12个月内，每个月中，相同料号的数量，以及采购金额；
2. 曲线图：历史趋势对比：
  a. 横轴：月份(当月)总采购金额，以及当月和查询月均购买的物料，在当月的购买金额；
  b. 料号比例：
  + 分子：在查询月份依然购买的料号数量；
  + 分母：1.当月总的采购料号数量；2.查询月份的采购料号数量；
3. 曲线图：组成分析：查询月份中的物料，在过去12个月中，从来没有买过的数量；有一个月购买的料号数量；有n个月购买的料号的数量；
  + 横轴：重复购买的分组：从 0次（过去12个月没有购买过） 到 12次（过去12个月，每个月都购买）；
  + 数据：每档内料号数量，采购金额占查询当月的占比；
  + 表格：重复次数，组内料号数，组内料号数量占比，组内金额占比；
4. 下钻：选中某一档后，显示该档内的料号清单，
   + 表格：透视表，该档次内的料号清单，列是过去 12 月，有过购买的，单元格内有购买量；
5. 下钻：选中某一颗料后，以采购订单，按时间显示趋势（同上）；
6. L：表示和历史 12月 比对；
7. R：表示和未来 12月 比对；

## 新料号分析（L/R）
1. 曲线图：
  1. 过去 n 个月，均未采购过的物料，称为当前月的新物料（n=12,9,6,3...）；
  2. 纵轴：查询期间内的每一个月的料号数量；
  3. 数据：新料号比例，n = 12, 9, 6, 3, ....
  4. 1. 对于成熟企业：新料号比例的趋势平均，而且偏低；
    2. 对于成长型企业，新料号比例的趋势没有定式，因为：新产品开发，新物料开发都可能会很频繁；
2. 表格：透视表
  1. 列：13个月；
  2. 行：固定 13 行；
    1. 第一行：料号：含义是 每个月的总料号；
    2. 之后1-12：含义是：以 n 为基准计算的每个月的新料号比例；
  3. 按列看：
    + 第一行是该月料号总数；
    + 之后的12行，都是新料号比例（以过去1个月为基准，以过去2个月为基准，....）
  4. 按行看：
     1. 在 12 个月来看，新料号比例的变化趋势（相同的基准）；
3. 下钻：点击表格中数字
4. + 两个参数：列（当前月份），行（数据项含义）
  + 如果选了第一行，那么显示当月所有料号明细
  + 如果选了其他行，显示：当前月份在该基准下（该行对应）的新料号的清单，采购量，采购金额
5. 下钻：点击单个物料，继续下钻；
6. L：查询月份，和历史月份相比（向时间轴的左边看）；
7. R：查询月份，和未来月份相比（向时间轴的右边看）；消亡物料 ：当月购买的物料，在未来n个月内，没有再次购买；


## 价格差异分析
1. 价格变动指数：查询期间内，最高价，和最低价，
  + 对于涨价：涨价幅度 = (最高价 - 最低价) / 最低价 * 100，记为正数；
  + 对于降价，降价幅度 = (最高价 - 最低价) / 最高价 * 100，记为负数；
2. 曲线图：对价格波动幅度进行分组，从涨价最多到降价最多，显示每组内的料号数；
  + 对于涨价，料号数显示正；
  + 对于降价，料号数显示负；
3. 表格：波动分组，组内料号数，料号数占比；
4. 下钻：点击某一档，显示该档内的物料号明细，表格：期间最高价，最低价，以及对应订单号，时间；
5. 下钻：选中某一个物料，显示期间内，
  + 饼图：该物料在不同供应商下的占比；
  + 曲线图：以时间顺序，显示每张订单的数量与采购单价；
  + 表格：采购订单列表； 