import fs from "fs";
import clc from "cli-color";
import uuid from "uuid";
import TelegramBot from "node-telegram-bot-api";

import Password from "./classes/protection/Password";
import { askPublic } from "./classes/Questionnaire";

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

const [file, userFile]: [string, string] = askWithRetry(() => {
	let name = askPublic('File name');
	if (!/^([a-zA-Z0-9\_\.]+)$/i.test(name)) throw 'Name should contain only letters, numbers, "_" and "."';
	if (name.slice(-5) != '.json') name += '.json';
	const tmp_name = workDir + (workDir.includes('/') ? '/' : '\\') + name;
	if (!fs.existsSync(tmp_name)) throw 'Incorrect path to file';
	return [tmp_name, name];
});
console.log('Read profile:', file);

const data: profile = JSON.parse(fs.readFileSync(file).toString());
if (!data) {
	console.error(clc.red('Can\'t parse json file'));
	process.exit(1);
}

if (!(data.wallets instanceof Array)) {
	console.error(clc.red('Incorrect format of wallets list'));
	process.exit(1);
}

const password = Password.askPassword();

function saveProfile() {
	fs.writeFileSync(file, JSON.stringify(data, null, 2));
	console.log(clc.greenBright('\n+ saved\n'));
}

const token = askPublic('Your token');

const tmp_verify_code = uuid.v4();

console.log('\nSay to your bot a code: ' + clc.bold(tmp_verify_code) + '\n');

data.telegram = {
	token: password.encrypt(token),
	chats: []
};

const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
	if (msg.text?.trim() !== tmp_verify_code) return;
	const chat_id = password.encrypt(msg.chat.id.toString());
	data.telegram?.chats.push(chat_id);
	await bot.sendMessage(msg.chat.id, '<b>Restake:</b> Bot has been connected to profile ' + userFile, { parse_mode: 'HTML' });
	console.log(clc.greenBright('Bot has been connected!'));

	saveProfile();

	console.log(clc.green('Completed'));
	process.exit(0);
});