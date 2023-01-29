import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Band extends Proto {
	protected prefix: string = 'band';
	protected nativeDenom: string = 'uband';
	protected coingeckoId: string = 'band-protocol';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/band/account/',
			tx: 'https://www.mintscan.io/band/txs/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-band.cosmostation.io/',
			gasPrice: 0.01,
			prefix: 'band',
			nativeDenom: 'uband'
		}
	}
}