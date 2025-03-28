import { ObservableItem } from '../types/observable-item';
import type { UIOperation } from '../types/ui-command';

import { Subject, filter, map, startWith } from 'rxjs';

const SymbolDelete = Symbol.for('delete');
const objectProxies = new WeakMap<Object, Subject<any>>();

/**
 * An Observable Object Proxy
**/
export const wrapxy =
	<I>
	(obj: I, topic: Subject<UIOperation<I>>, container: I[]): I | ObservableItem<I> => {
		if(typeof obj != 'object' || obj == null) {
			return obj
		}
		let bs = objectProxies.get(obj);
		if(!bs) {
			bs = new Subject<[string, any]>();
			objectProxies.set(obj, bs);
		}

		// Object.defineProperty(obj, Symbol.toStringTag, {value: 'xroxy', enumerable: false, writable: false, configurable: false});
		// obj.toString = () => 'WWW';
		const p = new Proxy(<I>obj, <ProxyHandler<I>>{
			deleteProperty: (target, prop) => {
	//			const idx = container.indexOf(target);
	//			const idx: StartPos = obj.indexOf(target);
				const result = delete target[prop as keyof I];
				topic.next(<UIOperation<I>>['deleteProperty', [target, prop]]);
				return result;
			},
			get(_target, prop, _caller) {
				// .observe(prop)
				if (prop == 'observe') {
					return (pr?: string) => {
						if(pr) {
							const ret = bs.pipe(
								filter(x => !!x),
								filter(([key, value]) => key == pr),
								map(([_, value]) => value),
								startWith(_target[pr as keyof I]),
							);
							// ret.value = obj[pr]; // Sure???
							return ret;
						} else {
							return bs;
						}
					}
				} else if (prop == 'subscribe') {
					return topic.subscribe.bind(topic);
				} else if (prop == 'observable') {
					// .observable.prop
					return new Proxy(obj, {
						// TODO: cache the proxy for repeated access to multiple properties
						get(target, prop, proxy) {
							const stream = bs.pipe(
								filter(x => !!x),
								filter(([key, value]) => key == prop),
								map(([_, value]) => value),
							);
							// @ts-ignore
							stream.value = obj[prop as keyof I];
							return stream;
						}
					});
				} else if (prop == 'next') {
					return (mergeable: keyof I) =>
						Object.entries(mergeable)
							.forEach(([k, v]) => obj[k] = v)
						// Object.target[prop] = v;
				} else if (prop == 'observer') {
					// TODO: do we want this?
					// .observable.prop
					return new Proxy(obj, {
						// TODO: cache the proxy for repeated access to multiple properties
						get(target, prop, proxy) {
							return (v: keyof I) => target[prop] = v;
						}
					});
				} else if (prop == SymbolDelete) {
					return () => {
						// console.log('Wrapxy: _delete', target, prop, caller, obj);
						// const idx = container.findIndex(x => obj == x);
						const idx = container.indexOf(obj);
						container.splice(idx, 1);
						topic.next(<UIOperation<I>>['splice', [idx, 1]]);
						//bs.next(<UIOperation<I>>['splice', [idx, 1]]);
					};
				} else {
					const res = obj[prop as keyof I];
					if (typeof res == 'object') {
						return wrapxy(res, topic, container /*, Number(prop)*/);
						// subscribe to deep changes?
					} else {
						return res;
					}
				}
			},
			set(target, prop: string, value) {
				const position = container.indexOf(target);
				target[prop as keyof I] = value;
				// if(!Array.isArray(target)) {
				// topic.next(['replace', [position, wrapxy(target, topic, container)]]);
				bs.next([prop, value]);
				topic.next(['update', [position, prop, value]]);
				// }
				return true;
			},
		});

		//Object.defineProperty(obj, Symbol.toStringTag, {value: `"${obj.title}"`, enumerable: false, writable: false, configurable: true});
		return p as ObservableItem<I>;
	}
;
