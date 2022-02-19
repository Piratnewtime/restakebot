import BigNumber from "bignumber.js";
import { Bsc_xct } from "..";
import { BuildedTx } from "../../../../types/BuildedTx";

const PrivateSaleAbi = require('../abis/PrivateSale.json');

export class Bsc_xct_private1 extends Bsc_xct {
	protected contract_address: string = '0x1bDc0247758a726f90549a640f21D9c27Ad0Cf0C';
  protected PrivateSale: any = null;

	async rewards (): Promise<number[]> {
    if (!this.PrivateSale) this.PrivateSale = new this.web3.eth.Contract(PrivateSaleAbi.abi, this.contract_address);

		const rewards = parseFloat(new BigNumber(await this.PrivateSale.methods.calcUnlockOf(this.address).call()).div(1e6).toFixed(6));
		return [rewards];
	}

  async restakeRewards (rewards: number[]): Promise<BuildedTx | null> {
    if (!rewards.length) return null;
    if (!this.web3) throw 'web3 is null';

    const abi = this.PrivateSale.methods.claim().encodeABI();
		const nonce = await this.web3.eth.getTransactionCount(this.address, 'pending');
		const chainId = await this.web3.eth.getChainId();
		const gasPrice = this.w.config.gasPrice || new BigNumber(await this.web3.eth.getGasPrice()).times(1.1).toFixed(0);

		const tx: tx = {
			from: this.address,
			to: this.contract_address,
			data: abi,
			gas: '0',
			nonce,
			gasPrice,
			chainId
		};
    
    const simulated_gas = await this.simulateTransaction(tx);
    tx.gas = new BigNumber(simulated_gas).times(1.3).toFixed(0);
    
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, this.secret.getKey());

    return {
      tx: signedTx.rawTransaction,
      gas: parseInt(simulated_gas),
      fee: parseFloat(new BigNumber(tx.gas).times(gasPrice).div(1e18).toFixed(18))
    }
  }
}

interface tx {
  from: string | number;
  to: string;
  value?: number | string;
  gas: number | string;
  gasPrice: number | string;
  maxPriorityFeePerGas?: number | string;
  maxFeePerGas?: number | string;
  data?: string;
  nonce?: number;
  chainId?: number;
  chain?: string;
  hardfork?: string;
}