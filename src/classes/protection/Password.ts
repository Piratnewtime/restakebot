import { askSecret } from "../Questionnaire";
import Cryptr from "cryptr";
import zlib from "zlib";

export default class Password {
	protected cryptr: Cryptr
	
	constructor (
		rawPassword: string
	) {
		this.cryptr = new Cryptr(rawPassword);
	}

	static askPassword (
		text: string = 'Password',
		length: number = 6
	): Password {
		let attemptions = 0;

		do {

			const pass = askSecret(text);

			if (pass.length < length) {
				console.error(`Short password (minimum ${length} symbols)`);
				attemptions++;
				continue;
			}

			return new Password(pass);

		} while (attemptions < 3)

		console.error('Create new password and try again later 🤔');
		process.exit(1);
	}

	encrypt (password: string): string {
		const hex = this.cryptr.encrypt(password);
		return zlib.deflateRawSync(Buffer.from(hex, 'hex')).toString('base64');
	}

	decrypt (base64: string): string {
		const hex = zlib.inflateRawSync(Buffer.from(base64, 'base64')).toString('hex');
		return this.cryptr.decrypt(hex);
	}
}