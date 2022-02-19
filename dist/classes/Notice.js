"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeStatus = void 0;
const links = {
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
        address: 'https://bscscan.com/token/0xe8670901e86818745b28c8b30b17986958fce8cc?a=',
        tx: 'https://bscscan.com/tx/'
    },
    bsc_xct_team: {
        address: 'https://bscscan.com/token/0xe8670901e86818745b28c8b30b17986958fce8cc?a=',
        tx: 'https://bscscan.com/tx/'
    },
    bsc_xct_autostake: {
        address: 'https://bscscan.com/token/0xe8670901e86818745b28c8b30b17986958fce8cc?a=',
        tx: 'https://bscscan.com/tx/'
    }
};
var NoticeStatus;
(function (NoticeStatus) {
    NoticeStatus["Initialised"] = "Initialised";
    NoticeStatus["Builded"] = "Builded";
    NoticeStatus["Sent"] = "Sent";
    NoticeStatus["Success"] = "Success";
    NoticeStatus["Failed"] = "Failed";
})(NoticeStatus = exports.NoticeStatus || (exports.NoticeStatus = {}));
class Notice {
    constructor(bot, chats, wallet, rewards) {
        this.bot = bot;
        this.chats = chats;
        this.wallet = wallet;
        this.rewards = rewards;
        this.message_ids = [];
        this.status = NoticeStatus.Initialised;
        this.balance = 0;
        this.gas = 0;
        this.fee = 0;
        this.error = '';
        this.txhash = '';
        this.pending_time = 0;
    }
    setStatus(status) {
        this.status = status;
        return this;
    }
    setBalance(amount) {
        this.balance = amount;
        return this;
    }
    setGas(gas) {
        this.gas = gas;
        return this;
    }
    setFee(fee) {
        this.fee = fee;
        return this;
    }
    setHash(hash) {
        this.txhash = hash;
        return this;
    }
    setError(text) {
        this.error = text;
        this.status = NoticeStatus.Failed;
        return this;
    }
    setPendingTime(time) {
        this.pending_time = time;
        return this;
    }
    render() {
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
        text += `<tg-spoiler><b>${this.wallet.config.address}</b></tg-spoiler>\n`;
        text += `Balance: ${this.balance}\n`;
        if (this.rewards.length) {
            text += '\n<b>Rewards:</b>\n';
            text += this.rewards.map(row => `- ${row}\n`).join('');
        }
        if (this.status !== NoticeStatus.Initialised) {
            text += '\n<b>Transaction:</b>\n';
            text += `Fee: ${this.fee} (gas: ${this.gas})\n`;
            if (this.txhash)
                text += `Hash: <tg-spoiler><b>${this.txhash}</b></tg-spoiler>\n`;
            if (this.pending_time)
                text += `Pending time: 🕒 <b>${parseFloat((this.pending_time / 60000).toFixed(5))} min</b>`;
        }
        if (this.status === NoticeStatus.Failed && this.error) {
            text += '\n<b>Error:</b>\n';
            text += `🛑 <code>${this.error}</code>`;
        }
        return text;
    }
    getReplyMarkup() {
        var _a, _b;
        let reply_markup = {
            inline_keyboard: [[]]
        };
        if ((_a = links[this.wallet.network]) === null || _a === void 0 ? void 0 : _a.address) {
            reply_markup.inline_keyboard[0].push({
                text: 'Wallet',
                url: links[this.wallet.network].address + this.wallet.config.address
            });
        }
        if (((_b = links[this.wallet.network]) === null || _b === void 0 ? void 0 : _b.tx) && this.txhash) {
            reply_markup.inline_keyboard[0].push({
                text: 'Transaction',
                url: links[this.wallet.network].tx + this.txhash
            });
        }
        return reply_markup;
    }
    send() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.chats || !(this.chats instanceof Array) || !((_a = this.chats) === null || _a === void 0 ? void 0 : _a.length))
                return false;
            const text = this.render();
            try {
                for (const index in this.chats) {
                    const chat_id = this.chats[index];
                    const message_id = this.message_ids[index];
                    const reply_markup = this.getReplyMarkup();
                    if (message_id) {
                        yield this.bot.editMessageText(text, {
                            chat_id,
                            message_id,
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                            reply_markup
                        });
                    }
                    else {
                        const msg = yield this.bot.sendMessage(chat_id, text, {
                            parse_mode: 'HTML',
                            disable_web_page_preview: true,
                            reply_markup
                        });
                        this.message_ids.push(msg.message_id);
                    }
                }
            }
            catch (error) {
                console.error(error);
                return false;
            }
            return true;
        });
    }
}
exports.default = Notice;
