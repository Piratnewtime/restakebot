import { Config } from "./Config";
import { Coin } from "./Coin";
import { TelegramConfig } from "./TelegramConfig";

export type Profile = {
	wallets: Wallet[],
	apps: never[],
	interval: number,
	telegram?: TelegramConfig
}

export type Wallet = {
	network: string,
	config: Config,
	triggers: Array<Coin>,
	interval?: number
}