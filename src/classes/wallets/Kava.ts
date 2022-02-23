import { NetworkLinks } from "../Notice";
import Proto from "./__proto__/cosmos_network/Cosmos_legacy";

export default class Kava extends Proto {
	protected prefix: string = 'kava';
	protected nativeDenom: string = 'ukava';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/kava/account/',
			tx: 'https://www.mintscan.io/kava/txs/'
		}
	}
}