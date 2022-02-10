import Password from "./Password";

export default class Secret {
	constructor (
		private key: string,
		private password: Password | null = null
	) {}

	checkKey (): boolean {
		if (!this.password) return false;
		try {
			this.password.decrypt(this.key);
			return true;
		} catch {
			return false;
		}
	}

	getKey (): string {
		return this.password?.decrypt(this.key) ?? this.key;
	}
}