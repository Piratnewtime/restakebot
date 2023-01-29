import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Cosmos extends Proto {
	protected coingeckoId: string = 'cosmos';

	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-cosmoshub.whispernode.com/',
			gasPrice: 0.026,
			prefix: 'cosmos',
			nativeDenom: 'uatom'
		}
	}
}