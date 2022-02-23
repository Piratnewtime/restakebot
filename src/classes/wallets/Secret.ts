import { NetworkLinks } from "../Notice";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Secret extends Proto {
	protected prefix: string = 'secret';
	protected nativeDenom: string = 'uscrt';

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://secretnodes.com/secret/chains/secret-4/accounts/',
			tx: 'https://www.mintscan.io/secret/txs/'
		}
	}
}