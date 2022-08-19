import { DefaultConfig } from "../Wallet";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Cosmos extends Proto {
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://lcd-cosmoshub.whispernode.com/',
			gasPrice: 0.01,
			prefix: 'cosmos',
			nativeDenom: 'uatom'
		}
	}
}