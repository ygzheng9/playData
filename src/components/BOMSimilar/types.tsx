// 父级，以及直接下级
export interface OneLevel {
  invCode: string;
  subList: string[];
}

// 母件，以及与之有共用子件的bom数量
export interface BOMOverlap {
  invCode: string;
  overlap: number;
  grade: number;
}

// 两个母件的共用子件
export interface BOMIntersection {
  invA: string;
  invB: string;
  both: string[];
  count: number;
}

// 各层的物料：顶层 H，中间层 M，底层 L
export interface MatLevelType {
  level: 'H' | 'M' | 'L';
  title: string;
  invList: string[];
}
