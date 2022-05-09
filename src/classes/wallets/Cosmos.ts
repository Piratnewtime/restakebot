import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Cosmos extends Proto {
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-cosmos.cosmostation.io/',
			gasPrice: 0.01,
			prefix: 'cosmos',
			nativeDenom: 'uatom'
		}
	}
}