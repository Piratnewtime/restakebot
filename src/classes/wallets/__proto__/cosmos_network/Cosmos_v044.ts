import axios from "axios";
import { CosmosRewards } from "../../../../types/CosmosRewards";

import Cosmos_legacy from "./Cosmos_legacy";

export default class Cosmos_v044 extends Cosmos_legacy {
	protected prefix: string = 'cosmos';
	protected nativeDenom: string = 'uatom';

	async balance (): Promise<number> {
		return (await axios.get(`${this.host}/cosmos/bank/v1beta1/balances/${this.getAddress()}/${this.nativeDenom}`, { timeout: 20000 })).data.balance.amount / 1e6;
	}

	async rewards (): Promise<CosmosRewards> {
		let list: CosmosRewards = (await axios.get(`${this.host}/cosmos/distribution/v1beta1/delegators/${this.getAddress()}/rewards`, { timeout: 20000 })).data.rewards;
		list = list.filter(pack => !!pack.reward.length);
		return list;
	}

	async getAccount (): Promise<account> {
		const { account } = (await axios.get(`${this.host}/cosmos/auth/v1beta1/accounts/${this.getAddress()}`)).data;
		return account;
	}
}

type account = {
	address: string,
	account_number: string,
	sequence: string
}