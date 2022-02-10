import fs from "fs";
import clc from "cli-color";
import TelegramBot from "node-telegram-bot-api";
import uuid from "uuid";

import Password from "./classes/protection/Password";
import { askSecret, askPublic, askSelectList, askYesNo } from "./classes/Questionnaire";

import { profile, wallet } from "./types/profile";

const workDir = process.cwd();

const data: profile = {
	wallets: [],
	interval: 3600,
	telegram: undefined
};

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

/** STEP 1: Setup main password */

let pass: string = askWithRetry(() => {
	const res = askSecret('Set-up your password');
	if (res.length < 6) throw 'Your password should contain minimum 6 symbols';
	return res;
});

askWithRetry(() => {
	const res = askSecret('Repeat your password');
	if (pass !== res) throw 'Passwords don\'t match';
});

console.log(clc.bgYellow(clc.black('   All Right! Let\'s begin!   ')));

const password = new Password(pass);

/** STEP 2: file name */

console.log(clc.bgYellow(clc.black('   Let\'s imagin name for your config file   ')));
const [file, userFile]: [string, string] = askWithRetry(() => {
	let name = askPublic('File name');
	if (!/^([a-zA-Z0-9\_\.]+)$/i.test(name)) throw 'Name should contain only letters, numbers, "_" and "."';
	if (name.slice(-5) != '.json') name += '.json';
	const tmp_name = workDir + (workDir.includes('/') ? '/' : '\\') + name;
	if (fs.existsSync(tmp_name)) throw 'This file already exists, try another name';
	return [tmp_name, name];
});

function saveProfile() {
	fs.writeFileSync(file, JSON.stringify(data, null, 2));
	console.log(clc.greenBright('\n+ saved\n'));
}

/** STEP 3: add wallets */

console.log('');
console.log(clc.bgYellow(clc.black('   Add some wallets   ')));

type preset = {
	[network: string]: {
		host: string,
		gasPrice: number,
		nativeDenom: string
	}
}

const presets: preset = {
	cosmos: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uatom',
	},
	secret: {
		host: 'https://lcd-secret.keplr.app',
		gasPrice: 0.15,
		nativeDenom: 'uscrt',
	},
	akash: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uakt',
	},
	kava: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'ukava',
	},
	osmosis: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uosmo',
	},
	comdex: {
		host: 'https://lcd-cosmos.cosmostation.io',
		gasPrice: 0.01,
		nativeDenom: 'uosmo',
	},
	bsc_xct: {
		host: 'https://bsc-dataseed.binance.org',
		gasPrice: 5000000000,
		nativeDenom: 'bnb',
	}
}

const networks = Object.keys(presets);

while (true) {
	const netId = askSelectList('Choose network', networks);
	if (netId < 0) {
		if (data.wallets.length) {
			break;
		} else {
			console.log('Your wallets list is empty');
			process.exit(0);
		}
	}
	if (!networks[netId]) throw 'Unexpected network id: ' + netId;
	const [net, counter] = networks[netId].split(' - ');
	const preset = presets[net];
	if (!preset) throw 'Undefined preset for this network';

	const w: wallet = {
		network: net,
		config: {
			host: preset.host,
			gasPrice: preset.gasPrice,
			nativeDenom: preset.nativeDenom,
			address: '',
			key: {
				type: 'privateKey',
				value: ''
			}
		},
		triggers: [],
		interval: undefined
	};

	w.config.address = askWithRetry(() => {
		const res = askPublic('Public address*');
		if (!res) throw 'Public address is required!';
		// to do: check this address
		return res;
	});

	w.config.key.value = askWithRetry(() => {
		const res = askPublic('Private key (hex)*');
		if (!res) throw 'Private key is required!';
		// to do: check this key
		return password.encrypt(res);
	});

	const gasPrice: number | '' = askWithRetry(() => {
		const res = askPublic('Gas price (' + preset.gasPrice + ')');
		if (!res) return '';
		if (isNaN(parseFloat(res))) throw 'Gas prise must be a number';
		return parseFloat(res);
	});
	if (gasPrice !== '') w.config.gasPrice = gasPrice;

	console.log('Write wanted minimum amount to withdraw rewards');

	const claimTrigger: string = askWithRetry(() => {
		const res = askPublic('Amount');
		if (!res || isNaN(parseFloat(res))) throw 'Amount must be a number';
		return res;
	});
	w.triggers.push({
		denom: preset.nativeDenom,
		amount: claimTrigger
	});

	data.wallets.push(w);

	saveProfile();

	networks[netId] = net + ' - ' + (parseInt(counter || '0') + 1);

	if(!askYesNo('Add another wallet?')) break;
}

/** STEP 4: change default interval of updates */

const new_interval: number | '' = askWithRetry(() => {
	let res: string | number = askPublic('Interval updates in seconds (3600 sec -> 1 hour)');
	if (!res) return '';
	res = parseInt(res);
	if (isNaN(res) || !res) return '';
	return res;
});
if (new_interval !== '') {
	data.interval = new_interval;
	saveProfile();
}

/** STEP 5: connect Telegram */

if(askYesNo('Connect Telegram notifications? (you need to have a bot)')) {
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

		end();
	});
} else {
	end();
}

function end() {
	console.log(clc.bgGreenBright(clc.black(' Profile saved! Now you can use command `restake ' + userFile + '` to start process. ')))
	console.log('');
	process.exit(0);
}