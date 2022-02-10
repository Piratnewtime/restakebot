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
exports.Bsc_xct_private1 = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const __1 = require("..");
const PrivateSaleAbi = require('../abis/PrivateSale.json');
class Bsc_xct_private1 extends __1.Bsc_xct {
    constructor() {
        super(...arguments);
        this.contract_address = '0x1bDc0247758a726f90549a640f21D9c27Ad0Cf0C';
        this.PrivateSale = null;
    }
    rewards() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.PrivateSale)
                this.PrivateSale = new this.web3.eth.Contract(PrivateSaleAbi.abi, this.contract_address);
            const rewards = parseFloat(new bignumber_js_1.default(yield this.PrivateSale.methods.calcUnlockOf(this.address).call()).div(1e6).toFixed(6));
            return [rewards];
        });
    }
    restakeRewards(rewards) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!rewards.length)
                return null;
            if (!this.web3)
                throw 'web3 is null';
            const abi = this.PrivateSale.methods.claim().encodeABI();
            const nonce = yield this.web3.eth.getTransactionCount(this.address, 'pending');
            const chainId = yield this.web3.eth.getChainId();
            const gasPrice = this.w.config.gasPrice || new bignumber_js_1.default(yield this.web3.eth.getGasPrice()).times(1.1).toFixed(0);
            const tx = {
                from: this.address,
                to: this.contract_address,
                data: abi,
                gas: '0',
                nonce,
                gasPrice,
                chainId
            };
            const simulated_gas = yield this.simulateTransaction(tx);
            tx.gas = new bignumber_js_1.default(simulated_gas).times(1.3).toFixed(0);
            const signedTx = yield this.web3.eth.accounts.signTransaction(tx, this.secret.getKey());
            return {
                tx: signedTx.rawTransaction,
                gas: parseInt(simulated_gas),
                fee: parseFloat(new bignumber_js_1.default(tx.gas).times(gasPrice).div(1e18).toFixed(18))
            };
        });
    }
}
exports.Bsc_xct_private1 = Bsc_xct_private1;
//# sourceMappingURL=Private1.js.map