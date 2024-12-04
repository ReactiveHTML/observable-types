type Fn<T> = (...args: any[]) => T;

export const maybeNew =
	<T>
	(Item: T | Fn<T>, ...args: any) => {
		if(args.length == 1 && typeof args[0] == 'object') {
			return args[0]
		} else {
			try {
				return (<Fn<I>>Item)(...args);
			} catch(e) { // e.name == 'TypeError'
				return new Item(...args);
				// try {
				// 	return new Item(...args);
				// } catch(e) {
				// 	return Item
				// }
			}
		}
	}
;
