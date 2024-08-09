export type StartPos = number;
export type DestPos = number;
export type Pos = number;

export type Count = number;
export type DeleteCount = number;

export type ArrayModificationMethod = 'pop' | 'shift' | 'sort' | 'reverse';
export type ArrayReadingMethod = 'map' | 'reduce' | 'filter' | 'forEach' | 'join' | 'slice' | 'some' | 'every' | 'indexOf';
export type ArrayMethod = ArrayReadingMethod | ArrayModificationMethod;
