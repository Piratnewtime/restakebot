import * as Profile from "../../types/Profile";
import Secret from "../protection/Secret";

export default class Wallet {
	public triggers: ({
		denom: string,
		amount: number
	})[] = []
	public target: string = ''

	protected host: string
	protected gasPrice: number
	readonly address: string
	protected nativeDenom: string

	constructor (public w: Profile.Wallet, protected secret: Secret) {
		const config = w.config;
		this.host = config.host;
		this.gasPrice = config.gasPrice;
		this.address = config.address;
		this.nativeDenom = config.nativeDenom;
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