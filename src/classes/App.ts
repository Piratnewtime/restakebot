import clc from "cli-color";
import { BuildedTx } from "../types/BuildedTx";
import Notice, { NoticeStatus } from "./Notice";
import { IWallet } from "./Wallet";

type NoticeProvider = (wallet_id: string, rewards: string[]) => Notice;
type LogDecorator = () => string;

export interface IApp {
	setNoticeProvider (fn: NoticeProvider): this
	setLogDecorator (fn: LogDecorator): this
	start (): Promise<never>
}

export interface IAppConstructable {
	new (wallets: AppWalletsAccess, params: unknown): IApp
}

type ProcessOptions = {
	wallet: AppWallet,
	rewards: string[],
	buildTx: () => Promise<BuildedTx>
};

export default class App {
	protected noticeProvider: NoticeProvider | null = null;
	private logDecorator: LogDecorator = () => '';

	setNoticeProvider (fn: NoticeProvider) {
		if (this.noticeProvider) return this;
		this.noticeProvider = fn;
		return this;
	}

	setLogDecorator (fn: LogDecorator) {
		this.logDecorator = fn;
		return this;
	}

	protected decoratedLog (type: 'log' | 'warn' | 'error', msgs: any[]) {
		if (type === 'log') {
			console.log(clc.bgWhite(clc.black(this.logDecorator())), ...msgs);
		} else if (type === 'warn') {
			console.warn(clc.bgYellow(clc.black(this.logDecorator())), ...msgs);
		} else if (type === 'error') {
			console.error(clc.bgRed(clc.whiteBright(this.logDecorator())), ...msgs);
		}
	}

	protected log (...msgs: any[]) {
		this.decoratedLog('log', msgs)
	}

	protected logWarn (...msgs: any[]) {
		this.decoratedLog('warn', msgs)
	}

	protected logError (...msgs: any[]) {
		this.decoratedLog('error', msgs)
	}

	protected urgentNotice (wallet: AppWallet, problem: string) {
		if (!this.noticeProvider) return;
		const wallet_id = typeof wallet === 'string' ? wallet : wallet.getId();
		this.noticeProvider(wallet_id, []).setError(problem).send();
	}

	async processingTransaction ({
		wallet,
		rewards,
		buildTx
	}: ProcessOptions): Promise<boolean> {
		let notice: Notice | null = null;
		if (this.noticeProvider) notice = this.noticeProvider(wallet.getId(), rewards);
		if (notice) await notice.send();

		try {

			const balance = await wallet.getBalance();
			if (notice) await notice.setBalance(balance).send();

			const tx = await buildTx();
			if (notice) await notice.setGas(tx.gas).setFee(tx.fee).setStatus(NoticeStatus.Builded).send();
			if (balance < tx.fee) throw `Fee (${tx.fee}) exceeds wallet balance (${balance})!`;

			const hash = await wallet.sendTransaction(tx.tx);
			if (notice) await notice.setHash(hash).setStatus(NoticeStatus.Sent).send();

			const sentTime = Date.now();
			try {
				await wallet.pendingTransaction(hash);
				if (notice) notice.setPendingTime(Date.now() - sentTime).setStatus(NoticeStatus.Success).send();
				return true;
			} catch (mempoolError) {
				if (notice) notice.setPendingTime(Date.now() - sentTime);
				throw mempoolError;
			}

		} catch (error) {
			if (notice) await notice.setError('' + error).send();
			this.logError(error);
		}
		return false;
	}
}

export class AppWalletsAccess {
	private access: Map<string, AppWallet> = new Map();

	constructor (wallets: Map<string, IWallet>, protected ids: string[]) {
		ids.forEach(id => {
			if (!wallets.has(id)) return;
			this.access.set(id, new AppWallet(wallets.get(id)!));
		});
	}

	toArray () {
		const list: AppWallet[] = [];
		this.access.forEach((wallet: AppWallet) => list.push(wallet));
		return list;
	}
}

export class AppWallet {
	constructor (private wallet: IWallet) {}

	getId () {
		return this.wallet.w.id!;
	}

	getNetwork () {
		return this.wallet.w.network;
	}

	getConfig () {
		return { ...this.wallet.w.config, key: null };
	}

	getAddress () {
		return this.wallet.getAddress();
	}

	getPublicName () {
		return this.wallet.getPublicName();
	}

	getBalance () {
		return this.wallet.balance();
	}

	simulateTransaction (tx: unknown) {
		return this.wallet.simulateTransaction(tx);
	}

	signTransaction (tx: unknown) {
		return this.wallet.signTransaction(tx);
	}

	sendTransaction (tx: unknown) {
		return this.wallet.sendTx(tx);
	}

	pendingTransaction (hash: string) {
		return this.wallet.pendingTx(hash);
	}
}