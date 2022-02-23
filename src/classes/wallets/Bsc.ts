import { NetworkLinks } from "../Notice";
import { Ethereum_legacy } from "./__proto__/ethereum/Ethereum_legacy";

export default class Bsc extends Ethereum_legacy {
	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://bscscan.com/address/',
			tx: 'https://bscscan.com/tx/'
		}
	}
}