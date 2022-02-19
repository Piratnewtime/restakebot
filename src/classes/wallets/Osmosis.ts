import axios from "axios";
import { CosmosV1 } from "./CosmosV1";
import { Coin } from "../../types/Coin";
import { CosmosRewards } from "../../types/CosmosRewards";

export class Osmosis extends CosmosV1 {
	async balance (): Promise<number> {
		const result: Coin[] | undefined = (await axios.get(`${this.host}/bank/balances/${this.address}`, { timeout: 20000 })).data.result;
		let amount: number = 0;
		if (result?.length) {
			const item = result.find(coin => coin.denom === this.nativeDenom);
			if (item) amount = parseInt(item.amount) / 1e6;
		}
		return amount;
	}

	async rewards (): Promise<CosmosRewards> {
		let list: CosmosRewards | null = (await axios.get(`${this.host}/distribution/delegators/${this.address}/rewards`, { timeout: 20000 })).data.result.rewards;
    if (list === null) return [];
    list = list.filter(pack => !!pack.reward.length);
    return list;
	}

	async getAccount (): Promise<account> {
    const { value } = (await axios.get(`${this.host}/auth/accounts/${this.address}`)).data.result;
    return value;
	}
}

type account = {
  address: string,
  account_number: string,
  sequence: string
}