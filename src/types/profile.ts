import { Config } from "./Config";
import { Coin } from "./Coin";
import { TelegramConfig } from "./TelegramConfig";

export type Profile = {
	wallets: Wallet[],
	apps: App[],
	interval: number,
	telegram?: TelegramConfig
}

export type Wallet = {
	id?: string,
	network: string,
	config: Config,
	triggers: Coin[],
	interval?: number
}

export type App = {
	app: string,
	alias?: string,
	wallets: string[],
	params: unknown
}