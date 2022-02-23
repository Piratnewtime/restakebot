import { NetworkLinks } from "../Notice";
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
}