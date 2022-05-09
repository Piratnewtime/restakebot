export type Config = {
	host: string,
	gasPrice: number,
	address?: string,
	alias?: string,
	key: {
		type: string,
		value: string
	}
}