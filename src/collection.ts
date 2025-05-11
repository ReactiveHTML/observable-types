import type { ArrayModificationMethod } from './types/array-meta';
import type { ICollection } from './types/icollection';
import type { UIOperation } from './types/ui-command';
import type { Observable } from 'rxjs';

import { BehaviorSubject, Subject, filter, map, share } from 'rxjs';
import { wrapxy } from './utils/wrapxy';
import { maybeNew } from './utils/maybe-new';
import { CollectionSink } from './collection-sink';
import { HTMLList } from './html-list';

class Item<T> {
	[Symbol.toPrimitive]: () => T;
	constructor(public value: T) {
		this[Symbol.toPrimitive] = () => this.value;
	}
};

export const Collection = <R, I extends Object>
	(initialValues = <R[]>[], ItemConstructor: ItemConstructorType<R> = Item<R>, CommandStream?: Observable<UIOperation<I>>): ICollection<I, R> => {
		const toItem = (x: any) => typeof x != 'object' ? maybeNew(ItemConstructor, x) : x;

		const _source: I[] = initialValues.map(v => maybeNew(ItemConstructor, v));
		const topic = new BehaviorSubject<UIOperation<I>>();
		topic.next(['assign', wrapxy<I>(_source, topic, _source)] as UIOperation<I>);
		//const topic = new Subject<UIOperation<I>>();
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
			return _source.length; // compat with Array.push
		};

		const unshiftFn = (...args: R[]) => {
			const newItems = args.map(toItem);
			const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
			_source.unshift(...newItems);
			topic.next(<UIOperation<I>>['unshift', wrapped]);
			return _source.length; // compat with Array.unshift
		};

		const _m = new Map<UIOperation<I>[0], any>([
			['_data', source],

			['subscribe', topic.subscribe.bind(topic)],
			['changes', topic.asObservable()],
			// Observe data from specific actions (e.g.: additions, removals, moves...)
			['observe', (action = 'push') => topic.pipe(
				filter(([cmd]) => cmd==action),
				map(data => data.length > 2 ? data.slice(1) : data[1]),
				share(),
			)],

			['pipe', topic.pipe.bind(topic)],

			...<[string ,any]>(['map', 'reduce', 'join', 'slice', 'some', 'every', 'indexOf']).map(k => [k, _source[k as keyof ArrayModificationMethod].bind(_source)]),
			...<UIOperation<I>[]>['pop', 'shift'].map(k => [k, () => tee(k as ('pop' | 'shift'))]),

			// TODO:
			// copyWithin
			// fill

			['splice', (start: number, deleteCount: number, ...newValues: I[]) => {
				const newItems = newValues.map(toItem);
				_source.splice(start, deleteCount, ...newItems);
				const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
				topic.next(<UIOperation<I>>['splice', [start, deleteCount, wrapped]]);
			}],

			['push', pushFn],
			['next', pushFn], // So it can behave like an Observer
			['unshift', unshiftFn],

			['filter', (fn: (item: I) => void) =>
				_source
					.map(x => wrapxy<I>(x, topic, _source))
					.filter(fn)
			],

			['_forEach', _source.forEach.bind(_source)],
			['forEach', (fn: (item: I) => void) => {
				_source
					.map(x => wrapxy<I>(x, topic, _source))
					.forEach(fn)
			}],
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

			['assign', (newItems: I[]) => {
				//source = newItems // reminder not to do this, 'cause the other functions hold a reference to the array
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

			//['toJSON', () => JSON.stringify(_source)],
			['toJSON', () => _source],
			['toString', () => JSON.stringify(_source)],
			['toArray', () => _source],
			['toWrappedArray', () => _source.map(x => wrapxy<I>(x, topic, _source))],
			[Symbol.toStringTag, _source[Symbol.toStringTag]],
			[Symbol.iterator, _source[Symbol.iterator]],
			[Symbol.asyncIterator, _source[Symbol.asyncIterator]],
			[Symbol.toPrimitive, _source[Symbol.toPrimitive]],

			// WIP. experimental
			// Tell Rimmel we're a sink
			['type', 'sink'],
			['sink', () => new CollectionSink(_m, HTMLList)],
			['t', 'Collection'],
			[Symbol.for('rml:sink'), () => new CollectionSink(_m, HTMLList)],
		]);

		CommandStream?.subscribe(([cmd, ...args]) =>
			_m.get(cmd)(...args)
		);

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
					prop == 'sink' ? new CollectionSink(_m) :
					source[prop as keyof typeof source]
				);
			},
		});
	}
;
