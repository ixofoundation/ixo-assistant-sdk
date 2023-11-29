import { fromHex } from '@cosmjs/encoding';

export const hex_to_uint8Arr = (str: string): Uint8Array => {
	const uint8Arr = fromHex(str);
	return uint8Arr;
};
