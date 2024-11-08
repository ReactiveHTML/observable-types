export const maybeNew = <T>(I: T | (() => T), ...args) => {
	if(args.length == 1 && typeof args[0] == 'object') {
		return args[0]
	} else {
		try {
			return I(...args);
		} catch(e) { // e.name == 'TypeError'
			return new I(...args);
			// try {
			// 	return new I(...args);
			// } catch(e) {
			// 	return I
			// }
		}
	}
}
