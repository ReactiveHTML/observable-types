import type { Observable, Observer } from "rxjs";

export type ObservableItem<T> = T & {
	observable: {
		[K in keyof T]: Observable<T[K]>
	};
	observe: <T>(key: keyof T) => Observable<T[K]>;
	observer: {
		[K in keyof T]: Observer<T[K]>
	};
	[Symbol.for('delete')]: () => void;
};
