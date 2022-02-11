import fs from "fs";
import clc from "cli-color";

import Password from "./classes/protection/Password";
import { askSecret, askPublic } from "./classes/Questionnaire";

import { profile } from "./types/profile";

function askWithRetry (clb: Function, attempts: number = 3): any {
	do {
		try {
			return clb();
		} catch (err) {
			console.error(clc.red(err));
		}
		attempts--;
	} while (attempts > 0)
	if (attempts < 1) console.log('Goodbye'), process.exit(1);
}

const workDir = process.cwd();

const [file]: [string, string] = askWithRetry(() => {
	let name = askPublic('File name');
	if (!/^([a-zA-Z0-9\_\.]+)$/i.test(name)) throw 'Name should contain only letters, numbers, "_" and "."';
	if (name.slice(-5) != '.json') name += '.json';
	const tmp_name = workDir + (workDir.includes('/') ? '/' : '\\') + name;
	if (!fs.existsSync(tmp_name)) throw 'Incorrect path to file';
	return [tmp_name, name];
});
console.log('Read profile:', file);

const profileData: profile = JSON.parse(fs.readFileSync(file).toString());
if (!profileData) {
	console.error(clc.red('Can\'t parse json file'));
	process.exit(1);
}

if (!(profileData.wallets instanceof Array)) {
	console.error(clc.red('Incorrect format of wallets list'));
	process.exit(1);
}

const current_pass = Password.askPassword();

console.log(clc.yellowBright('Decoding...'));

profileData.wallets.forEach(wallet => {
	wallet.config.key.value = current_pass.decrypt(wallet.config.key.value);
});

if (profileData.telegram) {
	profileData.telegram.token = current_pass.decrypt(profileData.telegram.token);
	profileData.telegram.chats = profileData.telegram.chats.map(chat_id => current_pass.decrypt(chat_id));
}

const new_pass_raw: string = askWithRetry(() => {
	const res = askSecret('Enter new password');
	if (res.length < 6) throw 'Your password should contain minimum 6 symbols';
	return res;
});

askWithRetry(() => {
	const res = askSecret('Repeat your new password');
	if (new_pass_raw !== res) throw 'Passwords don\'t match';
});

const new_pass = new Password(new_pass_raw);

console.log(clc.yellowBright('Encoding...'));

profileData.wallets.forEach(wallet => {
	wallet.config.key.value = new_pass.encrypt(wallet.config.key.value);
});

if (profileData.telegram) {
	profileData.telegram.token = new_pass.encrypt(profileData.telegram.token);
	profileData.telegram.chats = profileData.telegram.chats.map(chat_id => new_pass.encrypt(chat_id));
}

fs.writeFileSync(file, JSON.stringify(profileData, null, 2));

console.log(clc.green('Completed'));
process.exit(0);