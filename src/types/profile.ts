import { config } from "./config";
import { coin } from "./coin";
import { telegram_config } from "./telegram_config";

export type profile = {
	wallets: wallet[],
	interval: number,
	telegram: telegram_config | undefined
}

export type wallet = {
	network: string,
	config: config,
	triggers: Array<coin>,
	interval: number | undefined
}