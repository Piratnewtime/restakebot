import { builded_tx } from "../../types/builded_tx";
import { wallet } from "../../types/profile";

export default interface IWallet {
	address: string
	w: wallet

	balance (): Promise<number>
	rewards (): Promise<unknown[]>
	filterRewards (rewards: unknown[]): unknown[]
	summaryRewards (rewards: unknown[]): Array<string>
	addTrigger (amount: number, denom: string | null): this
	setTargetValidator (address: string): void

	restakeRewards (rewards: any): Promise<builded_tx | null>
	sendTx (tx_bytes: Uint8Array | string | unknown): Promise<string>
	pendingTx (hash: string): Promise<void>
}