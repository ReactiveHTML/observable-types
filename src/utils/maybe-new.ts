export const maybeNew = <T>(I: T | (() => T), ...args) => {
	try {
		return I(...args);
	} catch(e) {
		return new I(...args);
	}
}
