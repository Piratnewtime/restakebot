"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_color_1 = __importDefault(require("cli-color"));
const Password_1 = __importDefault(require("./classes/protection/Password"));
const Questionnaire_1 = require("./classes/Questionnaire");
let attempts = 0;
let pass;
do {
    pass = (0, Questionnaire_1.askSecret)('Set-up your password');
    if (pass.length >= 6)
        break;
    console.error(cli_color_1.default.red('Your password should contain minimum 6 symbols'));
    attempts++;
} while (attempts < 3);
if (attempts >= 3)
    console.log('Goodbye'), process.exit(1);
attempts = 0;
do {
    const pass_check = (0, Questionnaire_1.askSecret)('Repeat your password');
    if (pass === pass_check)
        break;
    console.error(cli_color_1.default.red('Passwords don\'t match'));
    attempts++;
} while (attempts < 3);
if (attempts >= 3)
    console.log('Goodbye'), process.exit(1);
console.log(cli_color_1.default.bgYellow(cli_color_1.default.black('   All Right! Let\'s begin!   ')));
const password = new Password_1.default(pass);
while (true) {
    const sk = (0, Questionnaire_1.askPublic)('Private key');
    if (!sk.length) {
        console.error(cli_color_1.default.red('Empty key'));
        continue;
    }
    const encrypted = password.encrypt(sk);
    console.log('Encrypted:', cli_color_1.default.bgWhite(' ' + cli_color_1.default.black(encrypted) + ' '));
}
//# sourceMappingURL=encoder.js.map