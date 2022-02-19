import { BuildedTx } from "../../types/BuildedTx";
import { Wallet } from "../../types/Profile";

export default interface IWallet {
	address: string
	w: Wallet

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