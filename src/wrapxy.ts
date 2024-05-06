import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { UIOperation } from './types/ui-command';
import { DestPos, Pos } from './types/array-meta';

export const wrapxy = <I extends Object>(obj, topic: Subject<UIOperation<I>>, container: I[]) => {

	type RU = 'replace' | 'update';
	type RUT<T> = T extends 'replace' ? [Pos, I] : [string, I];
    const valueFromUICommand = ([key, params]: [RU, RUT<RU>]) => {
        const mapping = new Map<string, Function>([
            [ 'replace', ([key, [pos, value]]) => value],
            [ 'update', ([key, [value]]) => value],
        ]);
        debugger;
        return mapping.get(key)?.(params);
    };

	return new Proxy(<I[]>obj, <ProxyHandler<I[]>>{
		deleteProperty: (target, prop) => {
			// console.log('Wrapxy: deleteProperty', target, prop);
			// const idx = container.findIndex(x => x == target);
			const idx = container.indexOf(target);
			const r = delete target[prop];
			topic.next(['replace', [idx, target]]);
			return r;
		},
		get(target, prop, caller) {
			if (prop == 'observe') {
				return (prop: string) => prop ? topic.pipe(
					filter(([k, v]) => k == 'update' && v == prop),
					map((x: UIOperation<I>) => valueFromUICommand(x)),
				) : topic;
			} else if (prop == '_value') {
				return obj;
			} else if (prop == 'next') {
				return data => obj = data;
			} else if (prop == '_delete') { // FIXME: maybe use a symbol, or some other way to avoid collisions
				return () => {
					// console.log('Wrapxy: _delete', target, prop, caller, obj);
					// const idx = container.findIndex(x => obj == x);
					const idx = container.indexOf(obj);
					container.splice(idx, 1);
					topic.next(<UIOperation<I>>['splice', [idx, 1]]);
				};
			} else {
				const res = target[prop];
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
   			topic.next(['update', [position, wrapxy(target, topic, container)]]);
            // }
			return true;
		},
	});
};
