export const maybeNew = <T>(I: T | (() => T), ...args) => {
	try {
		return I(...args);
	} catch(e) {
		// e.name == 'TypeError'
		try {
			return new I(...args);
		} catch(e) {
			return I
		}
	}
}
