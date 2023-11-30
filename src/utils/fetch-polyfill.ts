/*
Polyfill for fetch, will check first if already exists so save to call multiple times
*/
export const fetchPolyfill = async () => {
	if (typeof fetch === 'undefined') {
		if (typeof window !== 'undefined') {
			// For browsers, use whatwg-fetch or a similar library
			await import('whatwg-fetch');
			window.fetch = window.fetch;
		} else if (typeof global !== 'undefined') {
			// For Node.js, use node-fetch
			const nodeFetch = await import('node-fetch');
			// @ts-ignore
			global.fetch = nodeFetch.default || nodeFetch;
		} else {
			throw new Error('Unsupported environment for fetch');
		}
	}
};
