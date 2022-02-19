"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askYesNo = exports.askSelectList = exports.askPublic = exports.askSecret = void 0;
const readline_sync_1 = __importDefault(require("readline-sync"));
function askSecret(text) {
    return readline_sync_1.default.question(text + ': ', {
        hideEchoBack: true,
        mask: ''
    });
}
exports.askSecret = askSecret;
function askPublic(text) {
    return readline_sync_1.default.question(text + ': ');
}
exports.askPublic = askPublic;
function askSelectList(question, options) {
    return readline_sync_1.default.keyInSelect(options, question);
}
exports.askSelectList = askSelectList;
function askYesNo(question) {
    return readline_sync_1.default.keyInYNStrict(question);
}
exports.askYesNo = askYesNo;
