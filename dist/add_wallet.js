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
const networks_1 = __importDefault(require("./networks"));
const networks = Object.keys(networks_1.default);
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
    const preset = networks_1.default[net];
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
console.log(cli_color_1.default.green('Completed'));
process.exit(0);
//# sourceMappingURL=add_wallet.js.map