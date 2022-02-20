import clc from "cli-color";
import { readdirSync } from "fs";
import { IWalletConstructable } from "../Wallet";
import Wallet from "../Wallet";

const exceptions = [
	'index.js',
	'__proto__'
];

const files = readdirSync(__dirname).filter(path => !exceptions.includes(path));

type WalletsList = {
	[key: string]: IWalletConstructable
};

const list: WalletsList = {};

files.forEach(path => {
	const key = path.replace('.js', '');
	let module = require(__dirname + (__dirname.includes('/') ? '/' : '\\') + path);
	module = typeof module == 'object' && module.default;
	if (!module || !Wallet.isPrototypeOf(module)) {
		console.error(clc.red('Failed autoload wallet class: ' + path), module);
		return;
	}
	list[key.toLowerCase()] = module;
});

export default list;