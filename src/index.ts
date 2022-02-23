import fs from "fs";
import clc from "cli-color";
import TelegramBot from "node-telegram-bot-api";

import Secret from "./classes/protection/Secret";
import Password from "./classes/protection/Password";
import Notice, { NoticeStatus } from "./classes/Notice";

import networks from "./classes/wallets";
import apps from "./classes/apps";
import { IWallet } from "./classes/Wallet";
import { MaskAddress } from "./classes/Address";
import { Profile } from "./types/Profile";
import { AppWalletsAccess } from "./classes/App";

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

const profileData: Profile = JSON.parse(fs.readFileSync(file).toString());
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
const wallets_ids: Map<string, IWallet> = new Map();
const altered_wallets: Array<IWallet> = [];
const notices: Map<IWallet, Notice> = new Map();

profileData.wallets.forEach((w, index) => {
	w.network = w.network.toLowerCase();

	if (!(w.network in networks)) {
		console.error(`Network ${w.network} is not supported yet`);
		return;
	}

	const secret = new Secret(w.config.key.value, password);

	if (!secret.checkKey()) {
		console.error(clc.red(`Your ${w.network} wallet #${index} has incorrect key, please check your password`));
		process.exit(1);
	}

	const Module = networks[w.network];
	const wallet = new Module(w, secret);
	if (w.config.address && w.config.address != wallet.getAddress()) {
		console.error(clc.red(`Address "${w.config.address}" is not correct, real is "${MaskAddress(wallet.getAddress())}"`));
		process.exit(1);
	}

	if (w.triggers.length) {

		for (const trigger of w.triggers) {
			wallet.addTrigger(parseFloat(trigger.amount), trigger.denom);
		}

		if (w.interval) {
			altered_wallets.push(wallet);
			setInterval(() => { processWallet(wallet).catch(error => catchedError(wallet, error)) }, w.interval * 1000);
		} else {
			wallets.push(wallet);
		}
		
	}

	if (w.id) {
		if (wallets_ids.has(w.id)) {
			console.error(clc.red(`Duplicate wallet ID "${w.id}"!`));
			process.exit(1);
		}
		wallets_ids.set(w.id, wallet);
	}

	console.log(clc.bgWhite(clc.black(` ${index + 1}) Added ${w.network} wallet ${wallet.getPublicName()} `)));
});

const wTab = '      ';

async function processWallet(wallet: IWallet): Promise<void> {
	console.log('Check ' + clc.blue(wallet.getPublicName()), new Date().toISOString());
	const allRewards = await wallet.rewards();
	const rewards = wallet.filterRewards(allRewards);
	if (rewards.length) {
		console.info(wTab + clc.greenBright(`Rewards are found -> build restake`));
		const summaryList = wallet.summaryRewards(rewards);

		let notice: Notice | null = null;
		if (bot) {
			notice = new Notice(bot, profileData.telegram?.chats, wallet, summaryList);
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
	console.log(wTab + clc.italic('Done ' + clc.blueBright(wallet.getPublicName())), clc.italic(new Date().toISOString()));
	notices.delete(wallet);
}

async function main(): Promise<void> {
	const list = altered_wallets.length ? [...wallets, ...altered_wallets] : wallets;
	for (const wallet of list) {
		await processWallet(wallet).catch(error => catchedError(wallet, error));
	}
	if (altered_wallets.length) altered_wallets.length = 0;
}

/** Main start */
main().then(() => {

	/** Start apps */
	if (profileData.apps?.length) {
		profileData.apps.forEach(({ app, alias, wallets, params }, index) => {
			if (!(app in apps)) {
				console.warn(clc.red(`Application "${app}" [${index}] does not exist!`));
				return;
			}
			if (wallets.filter(wid => wallets_ids.has(wid)).length != wallets.length) {
				console.warn(clc.red(`Application "${app}" [${index}] has missed wallets id!`));
				return;
			}
			const publicAppName = app.toUpperCase() + (typeof alias == 'string' && alias ? ` [${alias}]` : '');
			const noticeAppName = app.toUpperCase() + (typeof alias == 'string' && alias ? `_${alias.replace(/\s/g, '_')}` : '');
			try {
				const appInstance = new apps[app](new AppWalletsAccess(wallets_ids, wallets), params);
				appInstance.setLogDecorator(() => ` ${new Date().toISOString()} | ${publicAppName} `);
				if (bot) appInstance.setNoticeProvider(function CreateNotice (wallet_id, rewards) {
					const wallet = wallets_ids.get(wallet_id)!;
					return new Notice(bot!, profileData.telegram?.chats, wallet, rewards, noticeAppName);
				});
				console.log(clc.bgYellowBright(clc.black(` ${index+1}) Start application ${publicAppName} `)));
				appInstance.start().catch(err => console.error(clc.bgRed(clc.black(` Start of application "${publicAppName}" has failed!`)), err));
			} catch (e) {
				console.error(clc.bgRed(clc.black(` Application "${publicAppName}" [${index}] has failed! `)));
				console.error(e);
			}
		})
	}

});

setInterval(main, profileData.interval * 1000);

function catchedError(wallet: IWallet, error: unknown): void {
	console.error(wTab + clc.bgRed(clc.black(` Wallet ${wallet.getPublicName()} has failed! `)));
	console.error(error);
	const notice = notices.get(wallet);
	if (notice) {
		notice.setError('' + error).send();
		notices.delete(wallet);
	} else if (bot) {
		new Notice(bot, profileData.telegram?.chats, wallet, []).setError('' + error).send();
	}
}