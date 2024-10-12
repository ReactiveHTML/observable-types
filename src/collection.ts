import type { ArrayModificationMethod } from './types/array-meta';
import type { UIOperation } from './types/ui-command';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { wrapxy } from './wrapxy';

export interface Collection<T> extends Array<T> {
	assign: (newItems: T[]) => void;
	move: (src: number, dst: number, count: number) => void;
	observe: (prop: string) => Observable<any>;
	toArray: () => T[];
};

export const Collection = <C extends I[], I extends Object>(_source = <I[]>[], Item: (x: any) => I = Object, CommandStream?: Observable<UIOperation<I>>) => {
	const topic2 = new Subject<UIOperation<I[]>>();
	const topic = new BehaviorSubject<UIOperation<I>>(['assign', wrapxy<I>(_source, topic2, _source)]);
	topic2.subscribe(topic);
	const source = wrapxy<I[]>(_source, topic, _source);

	// TODO: review and clean up
	const tee = (prop: ArrayModificationMethod, ...args) => {
		const res = _source[prop](...args);
		topic.next(<UIOperation<I>>[prop, args]);
		return res;
	};

	// TODO: review and clean up
	const tee2 = (prop: ArrayModificationMethod, ...args) => {
		const res = _source[prop](...args);
		topic.next(<UIOperation<I>>[prop, source[prop]]);
		return res;
	};

	const pushFn = (...args: I[]) => {
		const wrapped = args.map(x => wrapxy<I>(x, topic, _source));
		_source.push(...args);
		topic.next(<UIOperation<I>>['push', wrapped]);
	};

	const _m = new Map<string | number | symbol, any>([
		['_data', source],
		['sink', 'collection'], // Tell Rimmel we're a sink
		['subscribe', topic.subscribe.bind(topic)],

		...<[string ,any]>(['map', 'reduce', 'filter', 'join', 'slice', 'some', 'every', 'indexOf']).map(k => [k, _source[k].bind(_source)]),
		...<UIOperation<I>[]>['pop', 'shift'].map(k => [k, tee.bind(_source, k)]),
		...<UIOperation<I>[]>['unshift'].map(k => [k, tee2.bind(_source, k)]),
		// ['unshift', (...args: I[]) => {
		// 	const res = _source.unshift(...args);
		// 	topic.next(<UIOperation<I>>['unshift', ...args.map(x => wrapxy<I>(x, topic, _source))]);
		// 	return res;
		// }],

		['splice', (start: number, deleteCount: number, ...newItems: I[]) => {
			_source.splice(start, deleteCount, ...newItems);
			const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
			topic.next(<UIOperation<I>>['splice', [start, deleteCount, wrapped]]);
		}],

		['push', pushFn],
		['next', pushFn], // So it can behave like an Observer

		['unshift', (...args: I[]) => {
			const wrapped = args.map(x => wrapxy<I>(x, topic, _source));
			_source.unshift(...args);
			topic.next(['unshift', wrapped]);
		}],

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
			_source.splice(0, Infinity, ...newItems);
			//source = newItems // can't do, 'cause the other functions hold a reference to the array
			topic.next(['assign', newItems]);
			return source;
		}],

		['replace', (pos: number, newItem: I) => {
			_source[pos] = newItem;
			topic.next(['replace', [pos, newItem]]);
			return source;
		}],

		['setFilter', (filterFn: (item: I) => boolean) => {
			//_source.splice(0, Infinity, ...newItems);
			//source = newItems // can't do, 'cause the other functions hold a reference to the array
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
		// swap(src: number, dst: number, srcCount=1, dstCount=1)

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

	// const mergedObject = new Map(
	// 	Object.entries(_m)
	// 	.concat(
	// 		Object.getOwnPropertySymbols(_m).map(x => [x, _m[x]]),
	// 	)
	// );

	CommandStream?.subscribe(([cmd, ...args]) => {
		// FIXME: security - only allow known commands
		_m.get(cmd)(...args);
	})

	return <C>new Proxy(<C>_source, <ProxyHandler<C>>{
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
		get(target, prop, caller) {
			// FIXME: issues calling wrapxy(source[prop]) for prop = Symbol(Symbol.toPrimitive)
			return _m.get(prop) ??
				(
					prop == 'length' ? _source.length :
					prop == 'values' ? Object.values.bind(_source) :
						// wrapxy(source[prop])) //Reflect.get(...arguments);
						source[prop]
				); //Reflect.get(...arguments);
		},
	});
};

