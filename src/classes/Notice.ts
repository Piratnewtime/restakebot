import TelegramBot, { InlineKeyboardMarkup } from "node-telegram-bot-api";

import { wallet } from "../types/profile";

const links: { [network: string]: { address: string, tx: string } } = {
  cosmos: {
    address: 'https://www.mintscan.io/cosmos/account/',
    tx: 'https://www.mintscan.io/cosmos/txs/'
  },
  secret: {
    address: 'https://secretnodes.com/secret/chains/secret-4/accounts/',
    tx: 'https://www.mintscan.io/secret/txs/'
  },
  osmosis: {
    address: 'https://www.mintscan.io/osmosis/account/',
    tx: 'https://www.mintscan.io/osmosis/txs/'
  },
  akash: {
    address: 'https://www.mintscan.io/akash/account/',
    tx: 'https://www.mintscan.io/akash/txs/'
  },
  kava: {
    address: 'https://www.mintscan.io/kava/account/',
    tx: 'https://www.mintscan.io/kava/txs/'
  },
  comdex: {
    address: 'https://www.mintscan.io/comdex/account/',
    tx: 'https://www.mintscan.io/comdex/txs/'
  },
  bsc_xct: {
    address: 'https://bscscan.com/address/',
    tx: 'https://bscscan.com/tx/'
  }
};

export enum NoticeStatus {
	Initialised = 'Initialised',
	Builded = 'Builded',
  Sent = 'Sent',
	Success = 'Success',
	Failed = 'Failed'
}

export default class Notice {
	public message_ids: number[] = []
	public status: NoticeStatus = NoticeStatus.Initialised
  public balance: number = 0
	public gas: number = 0
	public fee: number = 0
	public error: string = ''
  public txhash: string = ''
  public pending_time: number = 0

	constructor(
		private bot: TelegramBot,
		public chats: string[] | undefined,
		public wallet: wallet,
		public rewards: string[]
	) {}

	setStatus(status: NoticeStatus) {
		this.status = status;
		return this;
	}

  setBalance(amount: number) {
    this.balance = amount;
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
		text += `<b>#${this.wallet.network.toUpperCase()} #${this.status.toUpperCase()}</b>\n`;
    text += `<code>${this.wallet.config.address}</code>\n`;
    text += `Balance: ${this.balance}\n`;

    if (this.rewards.length) {
      text += '\n<b>Rewards:</b>\n';
      text += this.rewards.map(row => `- ${row}\n`).join('');
    }

    if (this.status !== NoticeStatus.Initialised) {
      text += '\n<b>Transaction:</b>\n';
      text += `Fee: ${this.fee} (gas: ${this.gas})\n`;
      if (this.txhash) text += `Hash: <code>${this.txhash}</code>\n`;
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

    if (links[this.wallet.network]?.address) {
      reply_markup.inline_keyboard[0].push({
        text: 'Wallet',
        url: links[this.wallet.network].address + this.wallet.config.address
      });
    }

    if (links[this.wallet.network]?.tx && this.txhash) {
      reply_markup.inline_keyboard[0].push({
        text: 'Transaction',
        url: links[this.wallet.network].tx + this.txhash
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