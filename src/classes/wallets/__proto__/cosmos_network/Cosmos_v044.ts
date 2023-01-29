import axios from "axios";
import BigNumber from "bignumber.js";
import { CosmosRewards } from "../../../../types/CosmosRewards";

import Cosmos_legacy from "./Cosmos_legacy";

export default class Cosmos_v044 extends Cosmos_legacy {
	protected prefix: string = 'cosmos';
	protected nativeDenom: string = 'uatom';

	async balance (): Promise<number> {
		const data: balance = (await axios.get(`${this.host}/cosmos/bank/v1beta1/balances/${this.getAddress()}?by_denom=${this.nativeDenom}`, { timeout: 20000 })).data;
		if (data.balances?.length) {
			const balance = data.balances.find(_ => _.denom === this.nativeDenom);
			if (!balance) return 0;
			return parseInt(balance.amount) / 1e6;
		}
		return 0;
	}

	async staked (): Promise<number> {
		let amount = new BigNumber(0);
		const delegation_responses: delegated[] = await axios.get(`${this.host}/cosmos/staking/v1beta1/delegations/${this.getAddress()}?pagination.limit=100&pagination.count_total=false`, { timeout: 20000 }).then(res => res.data.delegation_responses);
		if (delegation_responses && delegation_responses.length) {
			delegation_responses.filter(_ => _.balance.denom === this.nativeDenom).forEach(_ => {
				amount = amount.plus(_.balance.amount);
			});
		}
		return amount.toNumber() / 1e6;
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

type balance = {
	balances: {
		amount: string
		denom: string
	}[]
}

type delegated = {
	balance: {
		amount: string
		denom: string
	}
}