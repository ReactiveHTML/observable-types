import type { ArrayModificationMethod } from './types/array-meta';
import type { ObservableItem } from './types/observable-item';
import type { UIOperation } from './types/ui-command';
import type { Observable, Subscriber } from 'rxjs';

import { BehaviorSubject, Subject } from 'rxjs';
import { wrapxy } from './wrapxy';

export type ICollection<T, R> = {
	[idx: number]: T;
	assign: (newItems: R[]) => void;
	move: (src: number, dst: number, count?: number) => void;
	observe: (prop: string) => Observable<any>;
	sort: (fn: (a: T, b: T) => number) => void;
	toArray: () => T[];
	toWrappedArray: () => ObservableItem<T>[];
} & Array<R> & Observable<UIOperation<T>> & Subscriber<UIOperation<T>>;

export const Collection = <R, I extends Object>
	(initialValues = <R[]>[], ItemConstructor: (r: R) => I, CommandStream?: Observable<UIOperation<I>>): ICollection<I, R> => {
		const toItem = (x: any) => typeof x != 'object' ? ItemConstructor(x) : x;

		const _source = initialValues.map(ItemConstructor);
		const topic2 = new Subject<UIOperation<I>>();
		const topic = new BehaviorSubject<UIOperation<I>>(['assign', wrapxy<I>(_source, topic2, _source)]);
		topic2.subscribe(topic);
		const source = wrapxy<I[]>(_source, topic, _source);

		// TODO: review and clean up
		const tee = (prop: ArrayModificationMethod, ...args) => {
			const res = _source[prop](...args);
			topic.next(<UIOperation<I>>[prop, args]);
			return res;
		};

		const pushFn = (...args: R[]) => {
			const newItems = args.map(toItem);
			const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
			_source.push(...newItems);
			topic.next(<UIOperation<I>>['push', wrapped]);
		};

		const unshiftFn = (...args: R[]) => {
			const newItems = args.map(toItem);
			const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
			_source.unshift(...newItems);
			topic.next(<UIOperation<I>>['unshift', wrapped]);
		};

		const _m = new Map<UIOperation<I>[0], any>([
			['_data', source],
			// ['type', 'sink'], // Tell Rimmel we're a sink
			// ['t', 'sink'], // Tell Rimmel we're a sink
			// ['sink', node => CollectionSink(_m, i => `rendered> ${i}`)(node)],
			['subscribe', topic.subscribe.bind(topic)],
			['pipe', topic.pipe.bind(topic)],

			...<[string ,any]>(['map', 'reduce', 'filter', 'join', 'slice', 'some', 'every', 'indexOf']).map(k => [k, _source[k as keyof ArrayModificationMethod].bind(_source)]),
			...<UIOperation<I>[]>['pop', 'shift'].map(k => [k, tee.bind(_source, k as ('pop' | 'shift'))]),

			['splice', (start: number, deleteCount: number, ...newValues: I[]) => {
				const newItems = newValues.map(toItem);
				_source.splice(start, deleteCount, ...newItems);
				const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
				topic.next(<UIOperation<I>>['splice', [start, deleteCount, wrapped]]);
			}],

			['push', pushFn],
			['next', pushFn], // So it can behave like an Observer
			['unshift', unshiftFn],

			['_forEach', _source.forEach.bind(_source)],

			['forEach', (fn: (item: I) => void) => {
				_source
					.map(x => wrapxy<I>(x, topic, _source))
					.forEach(fn)
				}
			],
			// findIndex: source.findIndex.bind(source),

			['sort', (fn: (a: I, b: I) => number) => {
				_source.sort(fn);
				// TODO: use fn results for smart repositioning info...
				topic.next(<['sort', I[]]>['sort', source]);
				return source;
			}],

			['reverse', () => {
				_source.reverse();
				topic.next(<['reverse', I[]]>['reverse', source]);
				return source;
			}],

			// filter2: (fn: (data: unknown) => boolean) => {
			// 	topic.next(['filter2', [fn, source]])
			// 	return source
			// },

			// refresh: item => {
			// 	topic.next(['refresh', data.indexOf(item)])
			// 	return source
			// },

			['assign', (newItems: I[]) => {
				//source = newItems // don't do, as the other functions hold a reference to the array
				_source.splice(0, Infinity, ...newItems);
				topic.next(['assign', newItems.map(x => wrapxy<I>(x, topic, _source))]);
				return source;
			}],

			['replace', (pos: number, newItem: I) => {
				_source[pos] = newItem;
				topic.next(['replace', [pos, newItem]]);
				return source;
			}],

			['setFilter', (filterFn: (item: I) => boolean) => {
				topic.next(['setFilter', filterFn]);
				return source;
			}],

			['move', (src: number, dst: number, count: number = 1) => {
				const removed = _source.splice(src, count);
				_source.splice(dst, 0, ...removed);
				topic.next(['move', [src, dst, count]]);
				return source;
			}],

			// TODO:
			// swap(src: number, dst: number)

			// observe: (ch) => topic.pipe(...([].concat(
			// 	ch ? filter(([channel]) => channel = ch) : [],
			// 	//startWith(['assign', source]),
			// ))),

			['toJSON', () => JSON.stringify(_source)],
			['toArray', () => _source],
			['toWrappedArray', () => _source.map(x => wrapxy<I>(x, topic, _source))],

			[Symbol.toStringTag, _source[Symbol.toStringTag]],
			[Symbol.iterator, _source[Symbol.iterator]],
			[Symbol.asyncIterator, _source[Symbol.asyncIterator]],
			[Symbol.toPrimitive, _source[Symbol.toPrimitive]],
		]);

		CommandStream?.subscribe(([cmd, ...args]) => {
			// we use the _m as a Map to protect against Prototype hijacking
			_m.get(cmd)(...args);
		})

		return new Proxy(<I[]>_source, <ProxyHandler<I[]>>{
			deleteProperty: (target, prop: any) => {
				if (isNaN(prop)) {
					const r = delete target[prop];
					topic.next(<UIOperation<I>>['splice', [prop, 1]]);
					return r;
				} else {
					const idx = Number(prop);
					_source.splice(idx, 1);
					topic.next(<UIOperation<I>>['splice', [idx, 1]]);
				}
			},
			get(_target, prop, _caller) {
				// FIXME: issues calling wrapxy(source[prop]) for prop = Symbol(Symbol.toPrimitive)
				return _m.get(prop as UIOperation<I>[0]) ?? (
					prop == 'length' ? _source.length :
					prop == 'values' ? Object.values.bind(_source) :
					source[prop as keyof typeof source]
				);
			},
		});
	}
;
