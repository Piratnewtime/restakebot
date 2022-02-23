import { NetworkLinks } from "../Notice";
import Proto from "./__proto__/cosmos_network/Cosmos_legacy";

export default class Osmosis extends Proto {
	protected prefix: string = 'osmo';
  protected nativeDenom: string = 'uosmo';

	getPublicLinks (): NetworkLinks {
    return {
      address: 'https://www.mintscan.io/osmosis/account/',
    	tx: 'https://www.mintscan.io/osmosis/txs/'
    }
  }
}