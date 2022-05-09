import BigNumber from "bignumber.js";
import Web3 from "web3";
import { IWallet } from "../../../Wallet";
import Wallet from "../../../Wallet";
import { BuildedTx } from "../../../../types/BuildedTx";
import * as Profile from "../../../../types/Profile";
import Secret from "../../../protection/Secret";
import { Address, MaskAddress } from "../../../Address";
import { NetworkLinks } from "../../../Notice";

export class Ethereum_legacy extends Wallet implements IWallet {
	protected web3: Web3;

	constructor (public w: Profile.Wallet, protected secret: Secret) {
		super(w, secret);
		this.web3 = new Web3(w.config.host);
	}

	getPublicLinks (): NetworkLinks {
		return {
			address: 'https://etherscan.io/address/',
			tx: 'https://etherscan.io/tx/'
		}
	}

	extractAddress () {
		return Address(this.web3.eth.accounts.privateKeyToAccount(this.secret.getKey()).address);
	}

	getPublicName () {
		return this.w.config.alias || this.w.config.address || MaskAddress(this.getAddress(), 6, 4);
	}

	async balance (): Promise<number> {
		return new BigNumber(await this.web3.eth.getBalance(this.getAddress(), 'pending')).div(1e18).toNumber();
	}

	async rewards (): Promise<never[]> {
		return [];
	}

	filterRewards (): never[] {
		return [];
	}

	summaryRewards (): never[] {
		return [];
	}

	async restakeRewards (): Promise<BuildedTx | null> {
		return null;
	}

	signTransaction (tx: Tx) {
		return this.web3.eth.accounts.signTransaction(tx, this.secret.getKey());
	}

	async sendTx (tx_bytes: Uint8Array | string): Promise<string> {
		return (await this.web3.eth.sendSignedTransaction(typeof tx_bytes != 'string' ? Buffer.from(tx_bytes).toString() : tx_bytes)).transactionHash;
	}

	async pendingTx (hash: string): Promise<void> {
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

	async simulateTransaction (tx: Tx): Promise<string> {
		let clone: Tx = { ...tx };
		clone.gas = Web3.utils.toHex(clone.gas);
		clone.gasPrice = Web3.utils.toHex(clone.gasPrice);
		
		return String(await this.web3.eth.estimateGas(clone));
	}
}

interface Tx {
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