import { Subject, filter, map } from 'rxjs';

import { UIOperation } from './types/ui-command';
import { Pos, StartPos } from './types/array-meta';

const objectProxies = new WeakMap<Object, Subject<any>>();

/**
 * An Observable Object Proxy
**/
export const wrapxy = <I extends Object>(obj: Object, topic: Subject<UIOperation<I>>, container: I[]) => {

	type OPS = 'replace' | 'update';
	type SHAPES<T> =
		T extends 'replace' ? [Pos, I]
		: T extends 'update' ? [string, I]
		: unknown;

	let bs = objectProxies.get(obj);
	if(!bs) {
		bs = new Subject<[string, any]>();
		objectProxies.set(obj, bs);
	}

	return new Proxy(<I[]>obj, <ProxyHandler<I[]>>{
		deleteProperty: (target, prop) => {
			debugger;
//			const idx = container.indexOf(target);
//			const idx: StartPos = obj.indexOf(target);
			const result = delete target[prop];
			topic.next(['delete', [position]]);
			return result;
		},
		get(_target, prop, _caller) {
			if (prop == 'observe') {
				return (p?: string) => {
					if(p) {
						const ret = bs.pipe(
							filter(x => !!x),
							filter(([key, value]) => key == p),
							map(([_, value]) => value),
						);
						ret.value = obj[p];
						return ret;
					} else {
						return bs;
					}
				}
			} else if (prop == 'observed') {
				return new Proxy(obj, {
					get(target, prop, proxy) {
						const stream = bs.pipe(
							filter(x => !!x),
							filter(([key, value]) => key == prop),
							map(([_, value]) => value),
						);
						stream.value = obj[prop];
						return stream;
					}
				});
			} else if (prop == '_delete') { // FIXME: maybe use a symbol, or some other way to avoid collisions
				return () => {
					// console.log('Wrapxy: _delete', target, prop, caller, obj);
					// const idx = container.findIndex(x => obj == x);
					const idx = container.indexOf(obj);
					container.splice(idx, 1);
					topic.next(<UIOperation<I>>['splice', [idx, 1]]);
					//bs.next(<UIOperation<I>>['splice', [idx, 1]]);
				};
			} else {
				const res = obj[prop];
				if (typeof res == 'object') {
					return wrapxy(res, topic, container /*, Number(prop)*/);
					// subscribe to deep changes?
				} else {
					return res;
				}
			}
		},
		set(target, prop, value) {
			const position = container.indexOf(target);
			target[prop] = value;
			// if(!Array.isArray(target)) {
			// topic.next(['replace', [position, wrapxy(target, topic, container)]]);
			bs.next([prop, value]);
			topic.next(['update', [position, prop, value]]);
			// }
			return true;
		},
	});
};
