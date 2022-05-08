import { Config } from "./Config";
import { Coin } from "./Coin";
import { TelegramConfig } from "./TelegramConfig";

export type Profile = {
	wallets: Wallet[],
	apps: App[],
	interval: number,
	telegram?: TelegramConfig
}

export type WalletProps = {
	network: string
}

export type Wallet = WalletProps & {
	id?: string,
	config: Config,
	triggers: Coin[],
	interval?: number
}

export type WalletDefaultConfigs = {
	network: string,
	host: string,
	gasPrice: number,
	prefix: string,
	nativeDenom: string
}

export type App = {
	app: string,
	alias?: string,
	wallets: string[],
	params: any
}