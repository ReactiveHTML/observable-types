import { ObservableItem } from './observable-item';

export type FilterFunction<T> = (item: ObservableItem<T>, index: number, array: ObservableItem<T>[]) => boolean;
