import BigNumber from "bignumber.js";
import Web3 from "web3";
import IWallet from "../IWallet";
import Wallet from "../Wallet";
import { builded_tx } from "../../../types/builded_tx";
import { wallet } from "../../../types/profile";
import Secret from "../../protection/Secret";

const TokenLockerAbi = require('./abis/TokenLocker.json');
const RewardingAbi = require('./abis/Rewarding.json');

export class Bsc_xct extends Wallet implements IWallet {
  protected web3: Web3 | null = null;
  protected TokenLocker: any = null;
  protected Rewarding: any = null;

  constructor (public w: wallet, protected secret: Secret) {
    super(w, secret);
    this.web3 = new Web3(w.config.host);
    this.TokenLocker = new this.web3.eth.Contract(TokenLockerAbi.abi, '0xe8670901E86818745b28C8b30B17986958fCe8Cc');
    this.Rewarding = new this.web3.eth.Contract(RewardingAbi.abi, '0xd66C4B98AEF322D4257F485d01767908C13a341a');
  }

	async balance (): Promise<number> {
    if (!this.web3) throw 'web3 is null';
    return new BigNumber(await this.web3.eth.getBalance(this.address, 'pending')).div(1e18).toNumber();
	}

	async rewards (): Promise<number[]> {
    const rewards = parseFloat(new BigNumber(await this.Rewarding.methods.claimable(this.address).call()).div(1e6).toFixed(6));
    return [rewards];
	}

	filterRewards (rewards: number[]): number[] {
		if (!this.triggers.length || rewards[0] < this.triggers[0].amount) return [];
    return rewards;
	}

  summaryRewards (rewards: number[]): string[] {
    const list: string[] = [
      rewards[0] + ' XCT'
    ];
    return list;
  }

  async restakeRewards (rewards: number[]): Promise<builded_tx | null> {
    if (!rewards.length) return null;
    if (!this.web3) throw 'web3 is null';

    const abi = this.TokenLocker.methods.restake().encodeABI();
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

  async sendTx (tx_bytes: Uint8Array | string): Promise<string> {
    if (!this.web3) throw 'web3 is null';

    return (await this.web3.eth.sendSignedTransaction(typeof tx_bytes != 'string' ? Buffer.from(tx_bytes).toString() : tx_bytes)).transactionHash;
  }

  async pendingTx (hash: string): Promise<void> {
    if (!this.web3) throw 'web3 is null';
    const startTime = Date.now();
    const timeout = 72 * 3600 * 1000;
    do {
      await new Promise(tick => setTimeout(tick, 5000));
      try {
        const reciept = await this.web3.eth.getTransactionReceipt(hash);
        if (!reciept.status) throw 'Transaction has failed';
        return;
      } catch {
        continue;
      }
    } while (Date.now() - startTime < timeout);
    throw 'Transaction wasn\'t found, timeout exceeded';
  }

  async simulateTransaction (tx: tx): Promise<string> {
    if (!this.web3) throw 'web3 is null';
    
    let clone: tx = { ...tx };
		clone.gas = Web3.utils.toHex(clone.gas);
		clone.gasPrice = Web3.utils.toHex(clone.gasPrice);
		
		return String(await this.web3.eth.estimateGas(clone));
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