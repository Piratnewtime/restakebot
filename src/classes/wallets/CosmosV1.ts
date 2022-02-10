import axios, { AxiosError } from "axios";
import BigNumber from "bignumber.js";
import { Wallet as WalletMethods, Transaction, Message, Coin, Fee } from "@bandprotocol/bandchain.js";
import IWallet from "./IWallet";
import Wallet from "./Wallet";
import { cosmos_rewards } from "../../types/cosmos_rewards";
import { builded_tx } from "../../types/builded_tx";

export class CosmosV1 extends Wallet implements IWallet {
	async balance (): Promise<number> {
		return (await axios.get(`${this.host}/cosmos/bank/v1beta1/balances/${this.address}/${this.nativeDenom}`, { timeout: 20000 })).data.balance.amount / 1e6;
	}

	async rewards (): Promise<cosmos_rewards> {
		return (await axios.get(`${this.host}/cosmos/distribution/v1beta1/delegators/${this.address}/rewards`, { timeout: 20000 })).data.rewards;
	}

	filterRewards (rewards: cosmos_rewards): cosmos_rewards {
		if (!this.triggers.length) return [];
		return rewards.filter(pack => {
      pack.reward = pack.reward.filter(i => {
        const trigger = this.triggers.find(t => t.denom === i.denom);
        return trigger && parseInt(i.amount) >= trigger.amount;
      });
      return pack.reward.length > 0;
		});
	}

  summaryRewards (rewards: cosmos_rewards): Array<string> {
    const list: Array<string> = [];
    rewards.forEach(pack => {
      pack.reward.forEach(i => {
        list.push(`${pack.validator_address} - ${parseInt(i.amount) / 1e6} ${i.denom.slice(1)}`);
      });
    });
    return list;
  }

  async restakeRewards (rewards: cosmos_rewards): Promise<builded_tx | null> {
    if (!rewards.length) return null;

    const { MsgWithdrawDelegatorReward, MsgDelegate } = Message;
    const msgs = [];
    const summary: { [denom: string]: BigNumber } = {};
    rewards.forEach(pack => {
      // withdraw
      msgs.push(new MsgWithdrawDelegatorReward(
        this.address,
        pack.validator_address,
      ));

      // stake to the same validator
      pack.reward.forEach(_ => {
        if (!summary[_.denom]) {
          summary[_.denom] = new BigNumber(_.amount);
        } else {
          summary[_.denom] = summary[_.denom].plus(_.amount);
        }

        if (this.target) return;

        let coin = new Coin();
        coin.setDenom(_.denom);
        coin.setAmount(_.amount.split('.')[0]);

        msgs.push(new MsgDelegate(
          this.address,
          pack.validator_address,
          coin
        ));
      });
    });

    if (this.target) {
      for (const denom in summary) {
        const amount = summary[denom].toString().split('.')[0];

        let coin = new Coin();
        coin.setDenom(denom);
        coin.setAmount(amount);

        msgs.push(new MsgDelegate(
          this.address,
          this.target,
          coin
        ));
      }
    }

    const account = await this.getAccount();

    const _tx = new Transaction()
      .withMessages(...msgs)
      .withAccountNum(parseInt(account.account_number))
			.withSequence(parseInt(account.sequence || '0'))
      .withChainId(await this.getChainId());

    let feeCoin = new Coin();
		feeCoin.setDenom(this.nativeDenom);
		feeCoin.setAmount('1');

    const _fee = new Fee();
		_fee.setAmountList([feeCoin]);
		_fee.setGasLimit(1);

    _tx.withFee(_fee);

    let json = JSON.parse(Buffer.from(_tx.getSignMessage()).toString());

		const gasFromSimulation = new BigNumber(await this.simulateTransaction(json)).times(1.3).toFixed(0);

		_fee.setGasLimit(parseInt(gasFromSimulation));

		const _feeAmount = new BigNumber(this.gasPrice).times(gasFromSimulation).toFixed(0);
    feeCoin.setAmount(_feeAmount);

    // Release delegation sum for fees
    for (const msg of msgs) {
      if (!(msg instanceof MsgDelegate)) continue;
      const coin: Coin | undefined = msg.getAmount();
      if (!coin) throw 'Incorrect coint to stake';
      const denom = coin.getDenom();
      if (denom != this.nativeDenom) continue;
      let amount = parseFloat(coin.getAmount() || '0');
      if (!amount) throw 'Incorrect amount to stake';
      coin.setAmount(new BigNumber(amount).minus(_feeAmount).toFixed(0));
      break;
    }

    // Sign and Send
    const privateKey = WalletMethods.PrivateKey.fromHex(this.secret.getKey());
    const pubkey = privateKey.toPubkey();

    const signDoc = _tx.getSignDoc(pubkey);
    const signature = privateKey.sign(signDoc);
    const txRawBytes = _tx.getTxData(signature, pubkey);

    return {
      tx: txRawBytes,
      gas: _fee.getGasLimit(),
      fee: parseInt(_feeAmount) / 1e6
    }
    
  }

  async sendTx (tx_bytes: Uint8Array | string): Promise<string> {

    const res = (await axios.post(`${this.host}/cosmos/tx/v1beta1/txs`, {
			tx_bytes: typeof tx_bytes === 'string' ? tx_bytes : Buffer.from(tx_bytes).toString('base64'),
			mode: 'BROADCAST_MODE_SYNC' // or BROADCAST_MODE_BLOCK (might be often failed)
		})).data.tx_response;

    if (res.code && res.raw_log) throw res.raw_log;
    return res.txhash;

  }

  async pendingTx (hash: string): Promise<void> {
    const startTime = Date.now();
    const timeout = 72 * 3600 * 1000;
    do {
      await new Promise(tick => setTimeout(tick, 5000));
      try {
        const res: tx_response = (await axios.get(`${this.host}/cosmos/tx/v1beta1/txs/${hash}`)).data.tx_response;
        if (res.code && res.raw_log) throw res.raw_log;
        return;
      } catch (axiosError: any) {
        if (axiosError.isAxiosError && axiosError.response.status === 400) {
          if (axiosError.response.data?.code === 3) {
            continue;
          } else {
            throw axiosError.response.data.message;
          }
        }
        throw axiosError;
      }
    } while (Date.now() - startTime < timeout);
    throw 'Transaction wasn\'t found, timeout exceeded';
  }

  async simulateTransaction (tx: {
    msgs: Array<{ type: string, value: object }>,
    sequence: string,
    memo: string,
    fee: any
  }): Promise<string> {

    const types: { [key: string]: string } = {
      'cosmos-sdk/MsgDelegate': '/cosmos.staking.v1beta1.MsgDelegate',
      'cosmos-sdk/MsgWithdrawDelegationReward': '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward'
    };

    const messages = tx.msgs.map(msg => {
			return {
				'@type': msg.type[0] === '/' ? msg.type : types[msg.type],
				...msg.value
			};
		});
	
		const txToSimulate = {
			'tx': {
				'body': {
					'messages': messages,
					'memo': tx.memo
				},
				'auth_info': {
					'signer_infos': [{
						'public_key': {
							'@type': '/cosmos.crypto.secp256k1.PubKey',
							'value': ''
						},
						'mode_info': {
							'single': {
								'mode': 'SIGN_MODE_UNSPECIFIED'
							}
						},
						'sequence': tx.sequence
					}],
					'fee': tx.fee
				},
				'signatures': [
					''
				]
			}
		};
	
		try {
			const result = (await axios.post(`${this.host}/cosmos/tx/v1beta1/simulate`, txToSimulate)).data;
			return result.gas_info.gas_used;
		} catch (e: AxiosError | any) {
      if (e.isAxiosError) {
        throw e.response?.data?.message;
      }
			throw e;
		}
  }

  async getAccount (): Promise<account> {
    const { account } = (await axios.get(`${this.host}/cosmos/auth/v1beta1/accounts/${this.address}`)).data;
    return account;
  }

  async getChainId (): Promise<string> {
    const { node_info: { network } } = (await axios.get(`${this.host}/node_info`)).data;
    return network;
  }
}

type account = {
  address: string,
  pub_key: {
    '@type': string,
    key: string
  },
  account_number: string,
  sequence: string
}

type tx_response = {
  height: string,
  txhash: string,
  code: number,
  data: string,
  raw_log: string,
  logs: unknown[],
  info: string,
  gas_wanted: string,
  gas_used: string,
  tx: unknown
}