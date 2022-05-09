import clc from "cli-color";
import { readdirSync } from "fs";
import App, { IAppConstructable } from "../App";

const exceptions = [
	'index.js',
	'__proto__'
];

const files = readdirSync(__dirname).filter(path => !exceptions.includes(path));

type AppsList = {
	[key: string]: IAppConstructable
};

const list: AppsList = {};

files.forEach(path => {
	const key = path.replace('.js', '');
	let module = require(__dirname + (__dirname.includes('/') ? '/' : '\\') + path);
	module = typeof module == 'object' && module.default;
	if (!module || !App.isPrototypeOf(module)) {
		console.error(clc.red('Failed autoload app class: ' + path), module);
		return;
	}
	list[key.toLowerCase()] = module;
});

export default list;