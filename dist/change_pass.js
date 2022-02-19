"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const cli_color_1 = __importDefault(require("cli-color"));
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
const [file] = askWithRetry(() => {
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
const profileData = JSON.parse(fs_1.default.readFileSync(file).toString());
if (!profileData) {
    console.error(cli_color_1.default.red('Can\'t parse json file'));
    process.exit(1);
}
if (!(profileData.wallets instanceof Array)) {
    console.error(cli_color_1.default.red('Incorrect format of wallets list'));
    process.exit(1);
}
const current_pass = Password_1.default.askPassword();
console.log(cli_color_1.default.yellowBright('Decoding...'));
profileData.wallets.forEach(wallet => {
    wallet.config.key.value = current_pass.decrypt(wallet.config.key.value);
});
if (profileData.telegram) {
    profileData.telegram.token = current_pass.decrypt(profileData.telegram.token);
    profileData.telegram.chats = profileData.telegram.chats.map(chat_id => current_pass.decrypt(chat_id));
}
const new_pass_raw = askWithRetry(() => {
    const res = (0, Questionnaire_1.askSecret)('Enter new password');
    if (res.length < 6)
        throw 'Your password should contain minimum 6 symbols';
    return res;
});
askWithRetry(() => {
    const res = (0, Questionnaire_1.askSecret)('Repeat your new password');
    if (new_pass_raw !== res)
        throw 'Passwords don\'t match';
});
const new_pass = new Password_1.default(new_pass_raw);
console.log(cli_color_1.default.yellowBright('Encoding...'));
profileData.wallets.forEach(wallet => {
    wallet.config.key.value = new_pass.encrypt(wallet.config.key.value);
});
if (profileData.telegram) {
    profileData.telegram.token = new_pass.encrypt(profileData.telegram.token);
    profileData.telegram.chats = profileData.telegram.chats.map(chat_id => new_pass.encrypt(chat_id));
}
fs_1.default.writeFileSync(file, JSON.stringify(profileData, null, 2));
console.log(cli_color_1.default.green('Completed'));
process.exit(0);
