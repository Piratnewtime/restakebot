import { NetworkLinks } from "../Notice";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Akash extends Proto {
	protected prefix: string = 'akash';
	protected nativeDenom: string = 'uakt';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://www.mintscan.io/akash/account/',
			tx: 'https://www.mintscan.io/akash/txs/'
		}
	}
}