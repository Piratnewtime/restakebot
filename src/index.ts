import fs from "fs";
import clc from "cli-color";
import TelegramBot from "node-telegram-bot-api";

import Secret from "./classes/protection/Secret";
import Password from "./classes/protection/Password";
import Notice, { NoticeStatus } from "./classes/Notice";

import * as modules from "./classes/wallets";
import IWallet from "./classes/wallets/IWallet";
import { profile } from "./types/profile";

let file = process.argv[2];
if (!file) {
	console.error(clc.red('Write path to json profile file'));
	process.exit(1);
}
if (file.slice(-5) != '.json') file += '.json';
const workDir = process.cwd();
if (file[0] != '/' && file[1] != ':') file = workDir + (workDir.includes('/') ? '/' : '\\') + file;
console.log('Read profile:', file);

if (!fs.existsSync(file)) {
	console.error(clc.red('Incorrect path to file'));
	process.exit(1);
}

const profileData: profile = JSON.parse(fs.readFileSync(file).toString());
if (!profileData) {
	console.error(clc.red('Can\'t parse json file'));
	process.exit(1);
}

if (!(profileData.wallets instanceof Array)) {
	console.error(clc.red('Incorrect format of wallets list'));
	process.exit(1);
}

const password = Password.askPassword();

let bot: TelegramBot | null = null;

if (profileData.telegram?.token && profileData.telegram.chats.length) {
	bot = new TelegramBot( password.decrypt(profileData.telegram.token) );
	profileData.telegram.chats = profileData.telegram.chats.map(chat_id => password.decrypt(chat_id));
}

const wallets: Array<IWallet> = [];
const altered_wallets: Array<IWallet> = [];
const notices: Map<IWallet, Notice> = new Map();

profileData.wallets.forEach((w, index) => {
	const secret = new Secret(w.config.key.value, password);

	if (!secret.checkKey()) {
		console.error(clc.red(`Your ${w.network} wallet ${w.config.address} has incorrect key, please check your password`));
		process.exit(1);
	}

	let wallet: IWallet;
	switch (w.network) {
		case 'cosmos':
		case 'secret':
		case 'akash':
		case 'band':
		case 'comdex':
			wallet = new modules.CosmosV1(w, secret);
			break;
		case 'osmosis':
		case 'kava':
			wallet = new modules.Osmosis(w, secret);
			break;
		case 'bsc_xct':
			wallet = new modules.Bsc_xct(w, secret);
			break;
		case 'bsc_xct_team':
			wallet = new modules.Bsc_xct_team(w, secret);
			break;
		default:
			return;
	}

	if (w.interval) {
		altered_wallets.push(wallet);
		setInterval(() => { processWallet(wallet).catch(error => catchedError(wallet, error)) }, w.interval * 1000);
	} else {
		wallets.push(wallet);
	}
	
	for (const trigger of w.triggers) {
		wallet.addTrigger(parseFloat(trigger.amount), trigger.denom);
	}

	console.log(clc.bgWhite(clc.black(` ${index + 1}) Added ${w.network} wallet ${w.config.address} `)));
});

const wTab = '      ';

async function processWallet(wallet: IWallet): Promise<void> {
	console.log('Check ' + clc.blue(wallet.address), new Date().toISOString());
	const allRewards = await wallet.rewards();
	const rewards = wallet.filterRewards(allRewards);
	if (rewards.length) {
		console.info(wTab + clc.greenBright(`Rewards are found -> build restake`));
		const summaryList = wallet.summaryRewards(rewards);

		let notice: Notice | null = null;
		if (bot) {
			notice = new Notice(bot, profileData.telegram?.chats, wallet.w, summaryList);
			notices.set(wallet, notice);
		}
		if (notice) await notice.send();

		summaryList.forEach(row => console.info(wTab + clc.bgGreenBright(clc.black(` ${row} `))));

		const data = await wallet.restakeRewards(rewards);
		if (data != null) {
			console.info(wTab + clc.greenBright(`Build restake is ready (Gas: ${data.gas}, Fee: ${data.fee}) -> send transaction`));
			if (notice) await notice.setGas(data.gas).setFee(data.fee).setStatus(NoticeStatus.Builded).send();
			const balance = await wallet.balance();
			if (notice) notice.setBalance(balance);
			if (balance >= data.fee) {
				//throw new Error('test error');
				const hash = await wallet.sendTx(data.tx);
				console.info(wTab + clc.greenBright(`Hash: ${hash}`));
				if (notice) await notice.setHash(hash).setStatus(NoticeStatus.Sent).send();
				// async waiting
				const sentTime = Date.now();
				wallet.pendingTx(hash).then(_ => {
					console.log(clc.bgGreen(clc.black(`Tx result: ${wallet.w.network} -> ${hash} -> success!`)));
					if (notice) notice.setPendingTime(Date.now() - sentTime).setStatus(NoticeStatus.Success).send();
				}).catch(pendingError => {
					console.error(clc.bgRedBright(clc.black(`Tx result: ${wallet.w.network} -> ${hash} -> failed!`)));
					console.error(pendingError);
					if (notice) notice.setPendingTime(Date.now() - sentTime).setError(pendingError).send();
				});
			} else {
				const errorText = `Fee (${data.fee}) exceeds wallet balance (${balance})!`;
				console.error(wTab + clc.redBright(errorText));
				if (notice) await notice.setError(errorText).send();
			}
		} else {
			const errorText = 'Build restake returned "null"';
			console.info(wTab + clc.yellowBright(errorText));
			if (notice) await notice.setError(errorText).send();
		}
	} else if (allRewards.length) {
		console.info(wTab + 'Rewards are found, but these are not enough for triggers');
		const summaryList = wallet.summaryRewards(allRewards);
		summaryList.forEach(row => console.info(wTab + clc.italic(row)));
	} else {
		console.info(wTab + 'No rewards');
	}
	console.log(wTab + clc.italic('Done ' + clc.blueBright(wallet.address)), clc.italic(new Date().toISOString()));
	notices.delete(wallet);
}

async function main(): Promise<void> {
	const list = altered_wallets.length ? [...wallets, ...altered_wallets] : wallets;
	for (const wallet of list) {
		await processWallet(wallet).catch(error => catchedError(wallet, error));
	}
	if (altered_wallets.length) altered_wallets.length = 0;
}

main();

setInterval(main, profileData.interval * 1000);

function catchedError(wallet: IWallet, error: unknown): void {
	console.error(wTab + clc.bgRed(clc.black(` Wallet ${wallet.address} has failed! `)));
	console.error(error);
	const notice = notices.get(wallet);
	if (notice) {
		notice.setError('' + error).send();
		notices.delete(wallet);
	} else if (bot) {
		new Notice(bot, profileData.telegram?.chats, wallet.w, []).setError('' + error).send();
	}
}