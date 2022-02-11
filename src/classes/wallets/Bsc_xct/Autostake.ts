import BigNumber from "bignumber.js";
import { Bsc_xct } from ".";
import { builded_tx } from "../../../types/builded_tx";

export class Bsc_xct_autostake extends Bsc_xct {
	async rewards (): Promise<number[]> {
		const available_balance = parseFloat(new BigNumber(await this.TokenLocker.methods.balanceOf(this.address).call()).div(1e6).toFixed(6));
		return [available_balance];
	}

  async restakeRewards (rewards: number[]): Promise<builded_tx | null> {
    if (!rewards.length) return null;
    if (!this.web3) throw 'web3 is null';

    const abi = this.TokenLocker.methods.stake(new BigNumber(rewards[0]).times(1e6).toFixed(0)).encodeABI();
		const nonce = await this.web3.eth.getTransactionCount(this.address, 'pending');
		const chainId = await this.web3.eth.getChainId();
		const gasPrice = this.w.config.gasPrice || new BigNumber(await this.web3.eth.getGasPrice()).times(1.1).toFixed(0);

		const tx: tx = {
			from: this.address,
			to: '0xe8670901E86818745b28C8b30B17986958fCe8Cc',
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