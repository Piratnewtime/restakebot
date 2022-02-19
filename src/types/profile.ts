import { Config } from "./Config";
import { Coin } from "./Coin";
import { TelegramConfig } from "./TelegramConfig";

export type Profile = {
	wallets: Wallet[],
	interval: number,
	telegram: TelegramConfig | undefined
}

export type Wallet = {
	network: string,
	config: Config,
	triggers: Array<Coin>,
	interval: number | undefined
}