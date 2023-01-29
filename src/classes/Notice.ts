import BigNumber from "bignumber.js";
import TelegramBot, { InlineKeyboardMarkup } from "node-telegram-bot-api";

import { IWallet } from "./Wallet";

export type NetworkLinks = { address: string, tx: string };

export enum NoticeStatus {
	Initialised = 'Initialised',
	Builded = 'Builded',
	Sent = 'Sent',
	Success = 'Success',
	Failed = 'Failed'
}

export default class Notice {
	private message_ids: number[] = []
	public status: NoticeStatus = NoticeStatus.Initialised
	public balance: number = -1
	public staked: number = -1
	public gas: number = -1
	public fee: number = 0
	public error: string = ''
	public txhash: string = ''
	public pending_time: number = 0
	public price: number | null = null
	private links: NetworkLinks

	constructor(
		private bot: TelegramBot,
		private chats: string[] | undefined,
		private wallet: IWallet,
		public rewards: string[],
		private app_name?: string
	) {
		this.links = wallet.getPublicLinks();
	}

	setStatus(status: NoticeStatus) {
		this.status = status;
		return this;
	}

	setPrice(price: number) {
		this.price = price;
		return this;
	}

	setBalance(amount: number, stakedAmount?: number) {
		this.balance = amount;
		if (stakedAmount) this.staked = stakedAmount;
		return this;
	}

	setStaked(amount: number) {
		this.staked = amount;
		return this;
	}

	setGas(gas: number) {
		this.gas = gas;
		return this;
	}

	setFee(fee: number) {
		this.fee = fee;
		return this;
	}

	setHash(hash: string) {
		this.txhash = hash;
		return this;
	}

	setError(text: string) {
		this.error = text;
		this.status = NoticeStatus.Failed;
		return this;
	}

	setPendingTime(time: number) {
		this.pending_time = time;
		return this;
	}

	render(): string {
		let text = '';
		switch (this.status) {
			case NoticeStatus.Initialised:
			case NoticeStatus.Builded:
				text += '🛠 ';
				break;
			case NoticeStatus.Sent:
				text += '🎶 ';
				break;
			case NoticeStatus.Success:
				text += '🎯 ';
				break;
			case NoticeStatus.Failed:
				text += '🔥 ';
				break;
		}
		text += `<b>#${this.wallet.w.network.toUpperCase()} #${this.status.toUpperCase()}${this.price ? '    💲' + this.price : ''}</b>\n`;
		if (this.app_name) text += `<b>App: #${this.app_name}</b>\n`;
		text += `<tg-spoiler><b>${this.wallet.getAddress()}</b></tg-spoiler>\n`;
		if (this.balance != -1) {
			const usdBalance = this.price ? `    <i>💲${new BigNumber(this.price).times(this.balance).toFixed(3)}</i>` : '';
			text += `Balance: ${this.balance}${usdBalance}\n`;
			if (this.staked > 0) {
				const usdStaked = this.price ? `    <i>💲${new BigNumber(this.price).times(this.staked).toFixed(3)}</i>` : '';
				text += `Staked: ${this.staked}${usdStaked}\n`;
				const totalBalance = new BigNumber(this.staked).plus(this.balance).toString();
				const usdTotal = this.price ? `    <i>💲${new BigNumber(this.price).times(totalBalance).toFixed(3)}</i>` : '';
				text += `Total balance: ${totalBalance}${usdTotal}\n`;
			}
		}

		if (this.rewards.length) {
			text += '\n<b>Rewards:</b>\n';
			text += this.rewards.map(row => `- ${row}\n`).join('');
		}

		if (this.status !== NoticeStatus.Initialised && this.gas != -1) {
			text += '\n<b>Transaction:</b>\n';
			const usdFee = this.price ? `    <i>💲${new BigNumber(this.price).times(this.fee).toFixed(3)}</i>` : '';
			text += `Fee: ${this.fee} (gas: ${this.gas})${usdFee}\n`;
			if (this.txhash) text += `Hash: <tg-spoiler><b>${this.txhash}</b></tg-spoiler>\n`;
			if (this.pending_time) text += `Pending time: 🕒 <b>${parseFloat((this.pending_time / 60000).toFixed(5))} min</b>`;
		}

		if (this.status === NoticeStatus.Failed && this.error) {
			text += '\n<b>Error:</b>\n';
			text += `🛑 <code>${this.error}</code>`;
		}

		return text;
	}

	getReplyMarkup(): InlineKeyboardMarkup {
		let reply_markup: InlineKeyboardMarkup = {
			inline_keyboard: [ [] ]
		};

		if (this.links?.address) {
			reply_markup.inline_keyboard[0].push({
				text: 'Wallet',
				url: this.links.address + this.wallet.getAddress()
			});
		}

		if (this.links?.tx && this.txhash) {
			reply_markup.inline_keyboard[0].push({
				text: 'Transaction',
				url: this.links.tx + this.txhash
			});
		}

		return reply_markup;
	}

	async send(): Promise<boolean> {
		if (!this.chats || !(this.chats instanceof Array) || !this.chats?.length) return false;

		const text = this.render();

		try {
			for (const index in this.chats) {
				const chat_id = this.chats[index];
				const message_id = this.message_ids[index];

				const reply_markup = this.getReplyMarkup();

				if (message_id) {
					await this.bot.editMessageText(text, {
						chat_id,
						message_id,
						parse_mode: 'HTML',
						disable_web_page_preview: true,
						reply_markup
					});
				} else {
					const msg = await this.bot.sendMessage(chat_id, text, {
						parse_mode: 'HTML',
						disable_web_page_preview: true,
						reply_markup
					});
					this.message_ids.push(msg.message_id);
				}
			}
		} catch (error) {
			console.error(error);
			return false;
		}

		return true;
	}
}