import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Secret extends Proto {
	protected prefix: string = 'secret';
	protected nativeDenom: string = 'uscrt';
	protected coingeckoId: string = 'secret';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://secretnodes.com/secret/chains/secret-4/accounts/',
			tx: 'https://www.mintscan.io/secret/txs/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://api-secret.citadel.one',
			gasPrice: 0.15,
			prefix: 'secret',
			nativeDenom: 'uscrt'
		}
	}
}