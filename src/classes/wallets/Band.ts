import { NetworkLinks } from "../Notice";
import Proto from "./__proto__/cosmos_network/Cosmos_v044";

export default class Band extends Proto {
	protected prefix: string = 'band';
  protected nativeDenom: string = 'uband';

	getPublicLinks (): NetworkLinks {
    return {
      address: 'https://www.mintscan.io/band/account/',
      tx: 'https://www.mintscan.io/band/txs/'
    }
  }
}