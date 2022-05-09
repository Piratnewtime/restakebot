import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_legacy";

export default class Osmosis extends Proto {
	protected prefix: string = 'osmo';
	protected nativeDenom: string = 'uosmo';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/osmosis/account/',
			tx: 'https://www.mintscan.io/osmosis/txs/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-osmosis.cosmostation.io/',
			gasPrice: 0,
			prefix: 'osmo',
			nativeDenom: 'uosmo'
		}
	}
}