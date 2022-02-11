import fs from "fs";
import clc from "cli-color";

import Password from "./classes/protection/Password";
import { askPublic, askSelectList, askYesNo } from "./classes/Questionnaire";

import { profile, wallet } from "./types/profile";

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

import presets from "./networks";

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

console.log(clc.green('Completed'));
process.exit(0);