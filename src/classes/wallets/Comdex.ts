import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Comdex extends Proto {
	protected prefix: string = 'comdex';
	protected nativeDenom: string = 'ucmdx';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/comdex/account/',
			tx: 'https://www.mintscan.io/comdex/txs/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-comdex.cosmostation.io/',
			gasPrice: 0.01,
			prefix: 'comdex',
			nativeDenom: 'ucmdx'
		}
	}
}