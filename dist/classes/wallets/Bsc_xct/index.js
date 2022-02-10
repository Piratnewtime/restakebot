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
exports.Bsc_xct = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const web3_1 = __importDefault(require("web3"));
const Wallet_1 = __importDefault(require("../Wallet"));
const TokenLockerAbi = require('./abis/TokenLocker.json');
const RewardingAbi = require('./abis/Rewarding.json');
class Bsc_xct extends Wallet_1.default {
    constructor(w, secret) {
        super(w, secret);
        this.w = w;
        this.secret = secret;
        this.web3 = null;
        this.TokenLocker = null;
        this.Rewarding = null;
        this.web3 = new web3_1.default(w.config.host);
        this.TokenLocker = new this.web3.eth.Contract(TokenLockerAbi.abi, '0xe8670901E86818745b28C8b30B17986958fCe8Cc');
        this.Rewarding = new this.web3.eth.Contract(RewardingAbi.abi, '0xd66C4B98AEF322D4257F485d01767908C13a341a');
    }
    balance() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3)
                throw 'web3 is null';
            return new bignumber_js_1.default(yield this.web3.eth.getBalance(this.address, 'pending')).div(1e18).toNumber();
        });
    }
    rewards() {
        return __awaiter(this, void 0, void 0, function* () {
            const rewards = parseFloat(new bignumber_js_1.default(yield this.Rewarding.methods.claimable(this.address).call()).div(1e6).toFixed(6));
            return [rewards];
        });
    }
    filterRewards(rewards) {
        if (!this.triggers.length || rewards[0] < this.triggers[0].amount)
            return [];
        return rewards;
    }
    summaryRewards(rewards) {
        const list = [
            rewards[0] + ' XCT'
        ];
        return list;
    }
    restakeRewards(rewards) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!rewards.length)
                return null;
            if (!this.web3)
                throw 'web3 is null';
            const abi = this.TokenLocker.methods.restake().encodeABI();
            const nonce = yield this.web3.eth.getTransactionCount(this.address, 'pending');
            const chainId = yield this.web3.eth.getChainId();
            const gasPrice = this.w.config.gasPrice || new bignumber_js_1.default(yield this.web3.eth.getGasPrice()).times(1.1).toFixed(0);
            const tx = {
                from: this.address,
                to: '0xe8670901E86818745b28C8b30B17986958fCe8Cc',
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
    sendTx(tx_bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3)
                throw 'web3 is null';
            return (yield this.web3.eth.sendSignedTransaction(typeof tx_bytes != 'string' ? Buffer.from(tx_bytes).toString() : tx_bytes)).transactionHash;
        });
    }
    pendingTx(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3)
                throw 'web3 is null';
            const startTime = Date.now();
            const timeout = 72 * 3600 * 1000;
            do {
                yield new Promise(tick => setTimeout(tick, 5000));
                try {
                    const reciept = yield this.web3.eth.getTransactionReceipt(hash);
                    if (!reciept.status)
                        throw 'Transaction has failed';
                    return;
                }
                catch (_a) {
                    continue;
                }
            } while (Date.now() - startTime < timeout);
            throw 'Transaction wasn\'t found, timeout exceeded';
        });
    }
    simulateTransaction(tx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.web3)
                throw 'web3 is null';
            let clone = Object.assign({}, tx);
            clone.gas = web3_1.default.utils.toHex(clone.gas);
            clone.gasPrice = web3_1.default.utils.toHex(clone.gasPrice);
            return String(yield this.web3.eth.estimateGas(clone));
        });
    }
}
exports.Bsc_xct = Bsc_xct;
//# sourceMappingURL=index.js.map