export type ICollection<T, R> = {
	[idx: number]: T;
	assign: (newItems: R[]) => void;
	move: (src: number, dst: number, count?: number) => void;
	observe: (prop: string) => Observable<any>;
	sort: (fn: (a: T, b: T) => number) => void;
	toArray: () => T[];
	toWrappedArray: () => ObservableItem<T>[];
} & Array<R> & Observable<UIOperation<T>> & Subscriber<UIOperation<T>>;

