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
exports.Osmosis = void 0;
const axios_1 = __importDefault(require("axios"));
const CosmosV1_1 = require("./CosmosV1");
class Osmosis extends CosmosV1_1.CosmosV1 {
    balance() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = (yield axios_1.default.get(`${this.host}/bank/balances/${this.address}`, { timeout: 20000 })).data.result;
            let amount = 0;
            if (result === null || result === void 0 ? void 0 : result.length) {
                const item = result.find(coin => coin.denom === this.nativeDenom);
                if (item)
                    amount = parseInt(item.amount) / 1e6;
            }
            return amount;
        });
    }
    rewards() {
        return __awaiter(this, void 0, void 0, function* () {
            let list = (yield axios_1.default.get(`${this.host}/distribution/delegators/${this.address}/rewards`, { timeout: 20000 })).data.result.rewards;
            if (list === null)
                return [];
            list = list.filter(pack => !!pack.reward.length);
            return list;
        });
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const { value } = (yield axios_1.default.get(`${this.host}/auth/accounts/${this.address}`)).data.result;
            return value;
        });
    }
}
exports.Osmosis = Osmosis;
