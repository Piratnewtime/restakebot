export type Address = string & { readonly address: unique symbol };

export function Address (address: string) {
	return address as Address;
}

export function MaskAddress (address: Address, start: number = 0, end: number = 0) {
	start = Math.abs(start);
	end = Math.abs(end);
	let res = '';
	if (start) res += address.slice(0, start);
	res += '░'.repeat(address.length - start - end);
	if (end) res += address.slice(-end);
	return res;
}