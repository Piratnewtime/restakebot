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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const cli_color_1 = __importDefault(require("cli-color"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const uuid_1 = __importDefault(require("uuid"));
const Password_1 = __importDefault(require("./classes/protection/Password"));
const Questionnaire_1 = require("./classes/Questionnaire");
const workDir = process.cwd();
const data = {
    wallets: [],
    interval: 3600,
    telegram: undefined
};
function askWithRetry(clb, attempts = 3) {
    do {
        try {
            return clb();
        }
        catch (err) {
            console.error(cli_color_1.default.red(err));
        }
        attempts--;
    } while (attempts > 0);
    if (attempts < 1)
        console.log('Goodbye'), process.exit(1);
}
/** STEP 1: Setup main password */
let pass = askWithRetry(() => {
    const res = (0, Questionnaire_1.askSecret)('Set-up your password');
    if (res.length < 6)
        throw 'Your password should contain minimum 6 symbols';
    return res;
});
askWithRetry(() => {
    const res = (0, Questionnaire_1.askSecret)('Repeat your password');
    if (pass !== res)
        throw 'Passwords don\'t match';
});
console.log(cli_color_1.default.bgYellow(cli_color_1.default.black('   All Right! Let\'s begin!   ')));
const password = new Password_1.default(pass);
/** STEP 2: file name */
console.log(cli_color_1.default.bgYellow(cli_color_1.default.black('   Let\'s imagin name for your config file   ')));
const [file, userFile] = askWithRetry(() => {
    let name = (0, Questionnaire_1.askPublic)('File name');
    if (!/^([a-zA-Z0-9\_\.]+)$/i.test(name))
        throw 'Name should contain only letters, numbers, "_" and "."';
    if (name.slice(-5) != '.json')
        name += '.json';
    const tmp_name = workDir + (workDir.includes('/') ? '/' : '\\') + name;
    if (fs_1.default.existsSync(tmp_name))
        throw 'This file already exists, try another name';
    return [tmp_name, name];
});
function saveProfile() {
    fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(cli_color_1.default.greenBright('\n+ saved\n'));
}
/** STEP 3: add wallets */
console.log('');
console.log(cli_color_1.default.bgYellow(cli_color_1.default.black('   Add some wallets   ')));
const presets = {
    cosmos: {
        host: 'https://lcd-cosmos.cosmostation.io',
        gasPrice: 0.01,
        nativeDenom: 'uatom',
    },
    secret: {
        host: 'https://lcd-secret.keplr.app',
        gasPrice: 0.01,
        nativeDenom: 'uscrt',
    },
    akash: {
        host: 'https://lcd-cosmos.cosmostation.io',
        gasPrice: 0.01,
        nativeDenom: 'uakt',
    },
    kava: {
        host: 'https://lcd-cosmos.cosmostation.io',
        gasPrice: 0.01,
        nativeDenom: 'ukava',
    },
    osmosis: {
        host: 'https://lcd-cosmos.cosmostation.io',
        gasPrice: 0.01,
        nativeDenom: 'uosmo',
    },
    comdex: {
        host: 'https://lcd-cosmos.cosmostation.io',
        gasPrice: 0.01,
        nativeDenom: 'uosmo',
    },
    bsc_xct: {
        host: 'https://bsc-dataseed.binance.org',
        gasPrice: 5000000000,
        nativeDenom: 'bnb',
    }
};
const networks = Object.keys(presets);
while (true) {
    const netId = (0, Questionnaire_1.askSelectList)('Choose network', networks);
    if (netId < 0) {
        if (data.wallets.length) {
            break;
        }
        else {
            console.log('Your wallets list is empty');
            process.exit(0);
        }
    }
    if (!networks[netId])
        throw 'Unexpected network id: ' + netId;
    const [net, counter] = networks[netId].split(' - ');
    const preset = presets[net];
    if (!preset)
        throw 'Undefined preset for this network';
    const w = {
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
        const res = (0, Questionnaire_1.askPublic)('Public address*');
        if (!res)
            throw 'Public address is required!';
        // to do: check this address
        return res;
    });
    w.config.key.value = askWithRetry(() => {
        const res = (0, Questionnaire_1.askPublic)('Private key (hex)*');
        if (!res)
            throw 'Private key is required!';
        // to do: check this key
        return password.encrypt(res);
    });
    const gasPrice = askWithRetry(() => {
        const res = (0, Questionnaire_1.askPublic)('Gas price (' + preset.gasPrice + ')');
        if (!res)
            return '';
        if (isNaN(parseFloat(res)))
            throw 'Gas prise must be a number';
        return parseFloat(res);
    });
    if (gasPrice !== '')
        w.config.gasPrice = gasPrice;
    console.log('Write wanted minimum amount to withdraw rewards');
    const claimTrigger = askWithRetry(() => {
        const res = (0, Questionnaire_1.askPublic)('Amount');
        if (!res || isNaN(parseFloat(res)))
            throw 'Amount must be a number';
        return res;
    });
    w.triggers.push({
        denom: preset.nativeDenom,
        amount: claimTrigger
    });
    data.wallets.push(w);
    saveProfile();
    networks[netId] = net + ' - ' + (parseInt(counter || '0') + 1);
    if (!(0, Questionnaire_1.askYesNo)('Add another wallet?'))
        break;
}
/** STEP 4: change default interval of updates */
const new_interval = askWithRetry(() => {
    let res = (0, Questionnaire_1.askPublic)('Interval updates in seconds (3600 sec -> 1 hour)');
    if (!res)
        return '';
    res = parseInt(res);
    if (isNaN(res) || !res)
        return '';
    return res;
});
if (new_interval !== '') {
    data.interval = new_interval;
    saveProfile();
}
/** STEP 5: connect Telegram */
if ((0, Questionnaire_1.askYesNo)('Connect Telegram notifications? (you need to have a bot)')) {
    const token = (0, Questionnaire_1.askPublic)('Your token');
    const tmp_verify_code = uuid_1.default.v4();
    console.log('\nSay to your bot a code: ' + cli_color_1.default.bold(tmp_verify_code) + '\n');
    data.telegram = {
        token: password.encrypt(token),
        chats: []
    };
    const bot = new node_telegram_bot_api_1.default(token, { polling: true });
    bot.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (((_a = msg.text) === null || _a === void 0 ? void 0 : _a.trim()) !== tmp_verify_code)
            return;
        const chat_id = password.encrypt(msg.chat.id.toString());
        (_b = data.telegram) === null || _b === void 0 ? void 0 : _b.chats.push(chat_id);
        yield bot.sendMessage(msg.chat.id, '<b>Restake:</b> Bot has been connected to profile ' + userFile, { parse_mode: 'HTML' });
        console.log(cli_color_1.default.greenBright('Bot has been connected!'));
        saveProfile();
        end();
    }));
}
else {
    end();
}
function end() {
    console.log(cli_color_1.default.bgGreenBright(cli_color_1.default.black(' Profile saved! Now you can use command `restake ' + userFile + '` to start process. ')));
    console.log('');
    process.exit(0);
}
//# sourceMappingURL=init.js.map