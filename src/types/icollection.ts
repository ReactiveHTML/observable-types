import type { ObservableItem } from './observable-item';
import type { UIOperation } from './ui-command';

import { Observable, Observer } from 'rxjs';

export type ICollection<T, R> = {
	[idx: number]: T;
	assign: (newItems: R[]) => void;
	move: (src: number, dst: number, count?: number) => void;
	observe: (prop: string) => Observable<any>;
	sort: (fn: (a: T, b: T) => number) => void;
	changes: Observable<UIOperation<T>>;
	toArray: () => T[];
	toWrappedArray: () => ObservableItem<T>[];
} & Array<R> & Observable<UIOperation<T>> & Observer<UIOperation<T>>;

