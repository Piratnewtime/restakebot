import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v046";

export default class Kava extends Proto {
	protected prefix: string = 'kava';
	protected nativeDenom: string = 'ukava';
	protected coingeckoId: string = 'kava';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/kava/account/',
			tx: 'https://www.mintscan.io/kava/txs/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-kava.cosmostation.io/',
			gasPrice: 0.01,
			prefix: 'kava',
			nativeDenom: 'ukava'
		}
	}
}