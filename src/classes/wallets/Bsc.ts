import { NetworkLinks } from "../Notice";
import { DefaultConfig } from "../Wallet";
import { Ethereum_legacy } from "./__proto__/ethereum/Ethereum_legacy";

export default class Bsc extends Ethereum_legacy {
	protected coingeckoId: string = 'binancecoin';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://bscscan.com/address/',
			tx: 'https://bscscan.com/tx/'
		}
	}
	
	static defaultConfig (): DefaultConfig {
		return {
			host: 'https://bsc-dataseed.binance.org',
			gasPrice: 5000000000,
			prefix: '0x',
			nativeDenom: 'bnb'
		}
	}
}