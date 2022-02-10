"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const cli_color_1 = __importDefault(require("cli-color"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const Secret_1 = __importDefault(require("./classes/protection/Secret"));
const Password_1 = __importDefault(require("./classes/protection/Password"));
const Notice_1 = __importStar(require("./classes/Notice"));
const modules = __importStar(require("./classes/wallets"));
let file = process.argv[2];
if (!file) {
    console.error(cli_color_1.default.red('Write path to json profile file'));
    process.exit(1);
}
if (file.slice(-5) != '.json')
    file += '.json';
const workDir = process.cwd();
if (file[0] != '/' && file[1] != ':')
    file = workDir + (workDir.includes('/') ? '/' : '\\') + file;
console.log('Read profile:', file);
if (!fs_1.default.existsSync(file)) {
    console.error(cli_color_1.default.red('Incorrect path to file'));
    process.exit(1);
}
const profileData = JSON.parse(fs_1.default.readFileSync(file).toString());
if (!profileData) {
    console.error(cli_color_1.default.red('Can\'t parse json file'));
    process.exit(1);
}
if (!(profileData.wallets instanceof Array)) {
    console.error(cli_color_1.default.red('Incorrect format of wallets list'));
    process.exit(1);
}
const password = Password_1.default.askPassword();
let bot = null;
if (((_a = profileData.telegram) === null || _a === void 0 ? void 0 : _a.token) && profileData.telegram.chats.length) {
    bot = new node_telegram_bot_api_1.default(password.decrypt(profileData.telegram.token));
    profileData.telegram.chats = profileData.telegram.chats.map(chat_id => password.decrypt(chat_id));
}
const wallets = [];
const altered_wallets = [];
const notices = new Map();
profileData.wallets.forEach((w, index) => {
    const secret = new Secret_1.default(w.config.key.value, password);
    if (!secret.checkKey()) {
        console.error(cli_color_1.default.red(`Your ${w.network} wallet ${w.config.address} has incorrect key, please check your password`));
        process.exit(1);
    }
    let wallet;
    switch (w.network) {
        case 'cosmos':
        case 'secret':
            wallet = new modules.CosmosV1(w, secret);
            break;
        case 'bsc_xct':
            wallet = new modules.Bsc_xct(w, secret);
            break;
        default:
            return;
    }
    if (w.interval) {
        altered_wallets.push(wallet);
        setInterval(() => { processWallet(wallet).catch(error => catchedError(wallet, error)); }, w.interval * 1000);
    }
    else {
        wallets.push(wallet);
    }
    for (const trigger of w.triggers) {
        wallet.addTrigger(parseFloat(trigger.amount), trigger.denom);
    }
    console.log(cli_color_1.default.bgWhite(cli_color_1.default.black(` ${index + 1}) Added ${w.network} wallet ${w.config.address} `)));
});
const wTab = '      ';
function processWallet(wallet) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Check ' + cli_color_1.default.blue(wallet.address), new Date().toISOString());
        let rewards = yield wallet.rewards();
        rewards = wallet.filterRewards(rewards);
        if (rewards.length) {
            console.info(wTab + cli_color_1.default.greenBright(`Rewards found -> build restake`));
            const summaryList = wallet.summaryRewards(rewards);
            let notice = null;
            if (bot) {
                notice = new Notice_1.default(bot, (_a = profileData.telegram) === null || _a === void 0 ? void 0 : _a.chats, wallet.w, summaryList);
                notices.set(wallet, notice);
            }
            if (notice)
                yield notice.send();
            summaryList.forEach(row => console.info(wTab + cli_color_1.default.bgGreenBright(cli_color_1.default.black(` ${row} `))));
            const data = yield wallet.restakeRewards(rewards);
            if (data != null) {
                console.info(wTab + cli_color_1.default.greenBright(`Build restake is ready (Gas: ${data.gas}, Fee: ${data.fee}) -> send transaction`));
                if (notice)
                    yield notice.setGas(data.gas).setFee(data.fee).setStatus(Notice_1.NoticeStatus.Builded).send();
                const balance = yield wallet.balance();
                if (notice)
                    notice.setBalance(balance);
                if (balance >= data.fee) {
                    //throw new Error('test error');
                    const hash = yield wallet.sendTx(data.tx);
                    console.info(wTab + cli_color_1.default.greenBright(`Hash: ${hash}`));
                    if (notice)
                        yield notice.setHash(hash).setStatus(Notice_1.NoticeStatus.Sent).send();
                    // async waiting
                    const sentTime = Date.now();
                    wallet.pendingTx(hash).then(_ => {
                        console.log(cli_color_1.default.bgGreen(cli_color_1.default.black(`Tx result: ${wallet.w.network} -> ${hash} -> success!`)));
                        if (notice)
                            notice.setPendingTime(Date.now() - sentTime).setStatus(Notice_1.NoticeStatus.Success).send();
                    }).catch(pendingError => {
                        console.error(cli_color_1.default.bgRedBright(cli_color_1.default.black(`Tx result: ${wallet.w.network} -> ${hash} -> failed!`)));
                        console.error(pendingError);
                        if (notice)
                            notice.setPendingTime(Date.now() - sentTime).setError(pendingError).send();
                    });
                }
                else {
                    const errorText = `Fee (${data.fee}) exceeds wallet balance (${balance})!`;
                    console.error(wTab + cli_color_1.default.redBright(errorText));
                    if (notice)
                        yield notice.setError(errorText).send();
                }
            }
            else {
                const errorText = 'Build restake returned "null"';
                console.info(wTab + cli_color_1.default.yellowBright(errorText));
                if (notice)
                    yield notice.setError(errorText).send();
            }
        }
        console.log(wTab + cli_color_1.default.italic('Done ' + cli_color_1.default.blueBright(wallet.address)), cli_color_1.default.italic(new Date().toISOString()));
        notices.delete(wallet);
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const list = altered_wallets.length ? [...wallets, ...altered_wallets] : wallets;
        for (const wallet of list) {
            yield processWallet(wallet).catch(error => catchedError(wallet, error));
        }
        if (altered_wallets.length)
            altered_wallets.length = 0;
    });
}
main();
setInterval(main, profileData.interval * 1000);
function catchedError(wallet, error) {
    var _a;
    console.error(wTab + cli_color_1.default.bgRed(cli_color_1.default.black(` Wallet ${wallet.address} has failed! `)));
    console.error(error);
    const notice = notices.get(wallet);
    if (notice) {
        notice.setError('' + error).send();
        notices.delete(wallet);
    }
    else if (bot) {
        new Notice_1.default(bot, (_a = profileData.telegram) === null || _a === void 0 ? void 0 : _a.chats, wallet.w, []).setError('' + error).send();
    }
}
//# sourceMappingURL=index.js.map