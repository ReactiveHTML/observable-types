import { Observable } from "rxjs";

export type ObservableItem<T> = T & {
	observable: {
		[K in keyof T]: Observable<T[K]>
	};
	[Symbol.for('delete')]: () => void;
}
