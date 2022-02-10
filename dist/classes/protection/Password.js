"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Questionnaire_1 = require("../Questionnaire");
const cryptr_1 = __importDefault(require("cryptr"));
const zlib_1 = __importDefault(require("zlib"));
class Password {
    constructor(rawPassword) {
        this.cryptr = new cryptr_1.default(rawPassword);
    }
    static askPassword(text = 'Password', length = 6) {
        let attemptions = 0;
        do {
            const pass = (0, Questionnaire_1.askSecret)(text);
            if (pass.length < length) {
                console.error(`Short password (minimum ${length} symbols)`);
                attemptions++;
                continue;
            }
            return new Password(pass);
        } while (attemptions < 3);
        console.error('Create new password and try again later 🤔');
        process.exit(1);
    }
    encrypt(password) {
        const hex = this.cryptr.encrypt(password);
        return zlib_1.default.deflateRawSync(Buffer.from(hex, 'hex')).toString('base64');
    }
    decrypt(base64) {
        const hex = zlib_1.default.inflateRawSync(Buffer.from(base64, 'base64')).toString('hex');
        return this.cryptr.decrypt(hex);
    }
}
exports.default = Password;
//# sourceMappingURL=Password.js.map