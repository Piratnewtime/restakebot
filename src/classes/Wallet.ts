import * as Profile from "../types/Profile";
import { Address, MaskAddress } from "./Address";
import Secret from "./protection/Secret";
import { BuildedTx } from "../types/BuildedTx";

export interface IWallet {
	w: Profile.Wallet
	
	getAddress (): Address
	getPublicName (): string
	balance (): Promise<number>
	rewards (): Promise<unknown[]>
	filterRewards (rewards: unknown[]): unknown[]
	summaryRewards (rewards: unknown[]): Array<string>
	addTrigger (amount: number, denom: string | null): this
	setTargetValidator (address: string): void

	restakeRewards (rewards: any): Promise<BuildedTx | null>
	sendTx (tx_bytes: Uint8Array | string | unknown): Promise<string>
	pendingTx (hash: string): Promise<void>
}

export interface IWalletConstructable extends IWallet {
	new (wallet: Profile.Wallet, secret: Secret): IWallet
}

export default class Wallet {
	public triggers: ({
		denom: string,
		amount: number
	})[] = []
	public target: string = ''

	protected host: string
	protected gasPrice: number
	private address: Address | null = null;
	protected nativeDenom: string = '';

	constructor (public w: Profile.Wallet, protected secret: Secret) {
		const config = w.config;
		this.host = config.host;
		this.gasPrice = config.gasPrice;
	}

	getAddress () {
		if (this.address) return this.address;
		this.address = this.extractAddress();
		return this.address;
	}

	extractAddress (): Address {
		throw 'extractAddress is not implimented';
	}

	getPublicName () {
		return this.w.config.alias || this.w.config.address || MaskAddress(this.getAddress());
	}

	addTrigger (amount: number, denom: string | null = null): this {
		if (denom === null) denom = this.nativeDenom;
		this.triggers.push({
			amount,
			denom
		});
		return this;
	}

	setTargetValidator (address: string): void {
		this.target = address;
	}
}