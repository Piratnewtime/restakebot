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
const uuid_1 = __importDefault(require("uuid"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const Password_1 = __importDefault(require("./classes/protection/Password"));
const Questionnaire_1 = require("./classes/Questionnaire");
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
const workDir = process.cwd();
const [file, userFile] = askWithRetry(() => {
    let name = (0, Questionnaire_1.askPublic)('File name');
    if (!/^([a-zA-Z0-9\_\.]+)$/i.test(name))
        throw 'Name should contain only letters, numbers, "_" and "."';
    if (name.slice(-5) != '.json')
        name += '.json';
    const tmp_name = workDir + (workDir.includes('/') ? '/' : '\\') + name;
    if (!fs_1.default.existsSync(tmp_name))
        throw 'Incorrect path to file';
    return [tmp_name, name];
});
console.log('Read profile:', file);
const data = JSON.parse(fs_1.default.readFileSync(file).toString());
if (!data) {
    console.error(cli_color_1.default.red('Can\'t parse json file'));
    process.exit(1);
}
if (!(data.wallets instanceof Array)) {
    console.error(cli_color_1.default.red('Incorrect format of wallets list'));
    process.exit(1);
}
const password = Password_1.default.askPassword();
function saveProfile() {
    fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(cli_color_1.default.greenBright('\n+ saved\n'));
}
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
    console.log(cli_color_1.default.green('Completed'));
    process.exit(0);
}));
//# sourceMappingURL=connect_tg.js.map