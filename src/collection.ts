import { HTMLString } from 'rimmel';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface Collection<T> extends Array<T> {
	assign: (newItems: T[]) => void;
	move: (src: number, dst: number, count: number) => void;
	// observe: ()
};

type ArrayMethod = 'map' | 'reduce' | 'filter' | 'forEach' | 'join' | 'slice' | 'some' | 'every' | 'indexOf' | 'pop' | 'shift' | 'sort' | 'reverse';

type StartPos = number;
type DestPos = number;
type Count = number;
type DeleteCount = number;
type UICommand<I> =
	[ArrayMethod] |
	// ['sink', ??? ] |
	// ['subscribe', ??? ] |

	['sort', I[]] |
	['reverse', I[]] |

	['assign', I | I[]] |
	['change', [StartPos, I]] |
	['push', I | I[]] |
	['unshift', I | I[]] |
	['move', [StartPos, DestPos, Count]] |
	['splice', [StartPos, DeleteCount, I | I[]]]
;

const wrapxy = <I>(obj, topic: Subject<UICommand<I>>, container: I[]) => {
	const p = new Proxy(obj, {
		deleteProperty: (target, prop) => {
			console.log('Wrapxy: deleteProperty', target, prop);
			// const idx = container.findIndex(x => x == target);
			const idx = container.indexOf(target);
			const r = delete target[prop];
			topic.next(['change', [idx, target]]);
			return r;
		},
		get(target, prop, caller) {
			if (prop == 'observe') {
				return prop => prop ? topic.pipe(
					filter(([p]) => p == prop),
					map(([_, [__, ___, value]]) => value),
				) : topic;
			} else if (prop == '_value') {
				return obj;
			} else if (prop == 'next') {
				return data => obj = data;
			} else if (prop == '_delete') { // FIXME: maybe use a symbol, or some other way to avoid collisions
				return () => {
					console.log('Wrapxy: _delete', target, prop, caller, obj);
					// const idx = container.findIndex(x => obj == x);
					const idx = container.indexOf(obj);
					container.splice(idx, 1);
					topic.next(['splice', [idx, 1]]);
				};
			} else {
				const res = target[prop];
				if (typeof res == 'object') {
					return wrapxy(res, topic, container, Number(prop));
					// subscribe to deep changes?
				} else {
					return res;
				}
			}
		},
		set(target, prop, value) {
			const position = container.indexOf(target);
			target[prop] = value;
			topic.next(['change', [position, wrapxy(target, topic, container)]]);
			return true;
		},
	});
	return <I>p;
};

export const Collection = <C extends I[], I>(_source = <I[]>[], Item: () => I = Object) => {
	const topic2 = new Subject<UICommand<I>>();
	const topic = new BehaviorSubject<UICommand<I>>(['assign', wrapxy<I>(_source, topic2, _source)]);
	topic2.subscribe(topic);
	const source = wrapxy<I>(_source, topic, _source);

	const tee = (prop: ArrayMethod, ...args) => {
		const res = _source[prop](...args);
		topic.next([prop, <any>args]);
		return res;
	};

	const tee2 = (prop, ...args) => {
		const res = _source[prop](...args);
		topic.next([prop, source[prop]]);
		return res;
	};

	const _m = {
		_data: source,
		sink: 'collection', // Tell Rimmel we're a sink
		subscribe: topic.subscribe.bind(topic),
		...Object.fromEntries([].concat(
			['map', 'reduce', 'filter', 'join', 'slice', 'some', 'every', 'indexOf'].map(k => [k, _source[k].bind(_source)]),
			['pop', 'unshift', 'shift'].map(k => [k, tee.bind(_source, k)]),
			['unshift'].map(k => [k, tee2.bind(_source, k)]),
		)),

		splice: (start, deleteCount, ...newItems: I[]) => {
			_source.splice(start, deleteCount, ...newItems);
			const wrapped = newItems.map(x => wrapxy<I>(x, topic, _source));
			topic.next(['splice', [start, deleteCount, wrapped]]);
		},

		push: (...args: I[]) => {
			// const wrapped = args.map(x => wrapxy<I>(x, topic, source));
			const wrapped = args.map(x => wrapxy<I>(x, topic, _source));
			_source.push(...args);
			topic.next(['push', wrapped]);
		},

		unshift: (...args: I[]) => {
			const wrapped = args.map(x => wrapxy<I>(x, topic, _source));
			_source.unshift(...args);
			topic.next(['unshift', wrapped]);
		},

		forEach: source.forEach.bind(source),
		// findIndex: source.findIndex.bind(source),

		sort: (fn: (a: unknown, b: unknown) => number) => {
			_source.sort(fn);
			// TODO: use fn results for smart repositioning info...
			topic.next(['sort', source]);
			return source;
		},

		reverse: () => {
			_source.reverse();
			topic.next(['reverse', source]);
			return source;
		},

		// filter2: (fn: (data: unknown) => boolean) => {
		// 	topic.next(['filter2', [fn, source]])
		// 	return source
		// },

		// refresh: item => {
		// 	topic.next(['refresh', data.indexOf(item)])
		// 	return source
		// },

		assign: (newItems: I[]) => {
			_source.splice(0, Infinity, ...newItems);
			//source = newItems // can't do, 'cause the other functions hold a reference to the array
			topic.next(['assign', newItems]);
			return source;
		},

		move: (src: number, dst: number, count: number = 1) => {
			const removed = _source.splice(src, count);
			_source.splice(dst, 0, ...removed);
			topic.next(['move', [src, dst, count]]);
			return source;
		},

		// TODO:
		// swap(src: number, dst: number, srcCount=1, dstCount=1)

		// observe: (ch) => topic.pipe(...([].concat(
		// 	ch ? filter(([channel]) => channel = ch) : [],
		// 	//startWith(['assign', source]),
		// ))),

		toJSON: () => _source,
		toArray: () => _source,

		[Symbol.toStringTag]: _source[Symbol.toStringTag],
		[Symbol.iterator]: _source[Symbol.iterator],
		[Symbol.asyncIterator]: _source[Symbol.asyncIterator],
		[Symbol.toPrimitive]: _source[Symbol.toPrimitive],
	};

	const mergedObject = new Map(
		[].concat(
			Object.entries(_m),
			Object.getOwnPropertySymbols(_m).map(x => [x, _m[x]]),
		)
	);

	return <C><unknown>new Proxy(mergedObject, {
		deleteProperty: (target, prop) => {
			if (isNaN(prop)) {
				const r = delete target[prop];
				topic.next(['splice', [prop, 1]]);
				return r;
			} else {
				const idx = Number(prop);
				_source.splice(idx, 1);
				topic.next(['splice', [idx, 1]]);
			}
		},
		get(target, prop, caller) {
			// FIXME: issues calling wrapxy(source[prop]) for prop = Symbol(Symbol.toPrimitive)
			return mergedObject.get(prop) ??
				(
					prop == 'length' ? _source.length :
						prop == 'values' ? Object.values.bind(_source) :
							// wrapxy(source[prop])) //Reflect.get(...arguments);
							source[prop]
				); //Reflect.get(...arguments);
		},
	});
};
