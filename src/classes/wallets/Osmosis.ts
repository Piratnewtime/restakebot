import axios, { AxiosError } from "axios";
import BigNumber from "bignumber.js";
import { CosmosV1 } from "./CosmosV1";
import { coin } from "../../types/coin";
import { cosmos_rewards } from "../../types/cosmos_rewards";

export class Osmosis extends CosmosV1 {
	async balance (): Promise<number> {
		const result: coin[] | undefined = (await axios.get(`${this.host}/bank/balances/${this.address}`, { timeout: 20000 })).data.result;
		let amount: number = 0;
		if (result?.length) {
			const item = result.find(coin => coin.denom === this.nativeDenom);
			if (item) amount = parseInt(item.amount) / 1e6;
		}
		return amount;
	}

	async rewards (): Promise<cosmos_rewards> {
		let list: cosmos_rewards | null = (await axios.get(`${this.host}/distribution/delegators/${this.address}/rewards`, { timeout: 20000 })).data.result.rewards;
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