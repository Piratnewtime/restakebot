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
exports.CosmosV1 = void 0;
const axios_1 = __importDefault(require("axios"));
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const bandchain_js_1 = require("@bandprotocol/bandchain.js");
const Wallet_1 = __importDefault(require("./Wallet"));
class CosmosV1 extends Wallet_1.default {
    balance() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield axios_1.default.get(`${this.host}/cosmos/bank/v1beta1/balances/${this.address}/${this.nativeDenom}`, { timeout: 20000 })).data.balance.amount / 1e6;
        });
    }
    rewards() {
        return __awaiter(this, void 0, void 0, function* () {
            let list = (yield axios_1.default.get(`${this.host}/cosmos/distribution/v1beta1/delegators/${this.address}/rewards`, { timeout: 20000 })).data.rewards;
            list = list.filter(pack => !!pack.reward.length);
            return list;
        });
    }
    filterRewards(rewards) {
        if (!this.triggers.length)
            return [];
        return rewards.filter(pack => {
            const reward = pack.reward.filter(i => {
                const trigger = this.triggers.find(t => t.denom === i.denom);
                return trigger && parseInt(i.amount) >= trigger.amount;
            });
            if (!reward.length)
                return false;
            pack.reward = reward;
            return true;
        });
    }
    summaryRewards(rewards) {
        const list = [];
        rewards.forEach(pack => {
            pack.reward.forEach(i => {
                list.push(`${pack.validator_address} - ${parseInt(i.amount) / 1e6} ${i.denom.slice(1)}`);
            });
        });
        return list;
    }
    restakeRewards(rewards) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!rewards.length)
                return null;
            const { MsgWithdrawDelegatorReward, MsgDelegate } = bandchain_js_1.Message;
            const msgs = [];
            const summary = {};
            rewards.forEach(pack => {
                // withdraw
                msgs.push(new MsgWithdrawDelegatorReward(this.address, pack.validator_address));
                // stake to the same validator
                pack.reward.forEach(_ => {
                    if (!summary[_.denom]) {
                        summary[_.denom] = new bignumber_js_1.default(_.amount);
                    }
                    else {
                        summary[_.denom] = summary[_.denom].plus(_.amount);
                    }
                    if (this.target)
                        return;
                    let coin = new bandchain_js_1.Coin();
                    coin.setDenom(_.denom);
                    coin.setAmount(_.amount.split('.')[0]);
                    msgs.push(new MsgDelegate(this.address, pack.validator_address, coin));
                });
            });
            if (this.target) {
                for (const denom in summary) {
                    const amount = summary[denom].toString().split('.')[0];
                    let coin = new bandchain_js_1.Coin();
                    coin.setDenom(denom);
                    coin.setAmount(amount);
                    msgs.push(new MsgDelegate(this.address, this.target, coin));
                }
            }
            const account = yield this.getAccount();
            const _tx = new bandchain_js_1.Transaction()
                .withMessages(...msgs)
                .withAccountNum(parseInt(account.account_number))
                .withSequence(parseInt(account.sequence || '0'))
                .withChainId(yield this.getChainId());
            let feeCoin = new bandchain_js_1.Coin();
            feeCoin.setDenom(this.nativeDenom);
            feeCoin.setAmount('1');
            const _fee = new bandchain_js_1.Fee();
            _fee.setAmountList([feeCoin]);
            _fee.setGasLimit(1);
            _tx.withFee(_fee);
            let json = JSON.parse(Buffer.from(_tx.getSignMessage()).toString());
            const gasFromSimulation = new bignumber_js_1.default(yield this.simulateTransaction(json)).times(1.3).toFixed(0);
            _fee.setGasLimit(parseInt(gasFromSimulation));
            const _feeAmount = new bignumber_js_1.default(this.gasPrice).times(gasFromSimulation).toFixed(0);
            feeCoin.setAmount(_feeAmount);
            // Release delegation sum for fees
            for (const msg of msgs) {
                if (!(msg instanceof MsgDelegate))
                    continue;
                const coin = msg.getAmount();
                if (!coin)
                    throw 'Incorrect coint to stake';
                const denom = coin.getDenom();
                if (denom != this.nativeDenom)
                    continue;
                let amount = parseFloat(coin.getAmount() || '0');
                if (!amount)
                    throw 'Incorrect amount to stake';
                coin.setAmount(new bignumber_js_1.default(amount).minus(_feeAmount).toFixed(0));
                break;
            }
            // Sign and Send
            const privateKey = bandchain_js_1.Wallet.PrivateKey.fromHex(this.secret.getKey());
            const pubkey = privateKey.toPubkey();
            const signDoc = _tx.getSignDoc(pubkey);
            const signature = privateKey.sign(signDoc);
            const txRawBytes = _tx.getTxData(signature, pubkey);
            return {
                tx: txRawBytes,
                gas: _fee.getGasLimit(),
                fee: parseInt(_feeAmount) / 1e6
            };
        });
    }
    sendTx(tx_bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = (yield axios_1.default.post(`${this.host}/cosmos/tx/v1beta1/txs`, {
                tx_bytes: typeof tx_bytes === 'string' ? tx_bytes : Buffer.from(tx_bytes).toString('base64'),
                mode: 'BROADCAST_MODE_SYNC' // or BROADCAST_MODE_BLOCK (might be often failed)
            })).data.tx_response;
            if (res.code && res.raw_log)
                throw res.raw_log;
            return res.txhash;
        });
    }
    pendingTx(hash) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const timeout = 72 * 3600 * 1000;
            do {
                yield new Promise(tick => setTimeout(tick, 5000));
                try {
                    const res = (yield axios_1.default.get(`${this.host}/cosmos/tx/v1beta1/txs/${hash}`)).data.tx_response;
                    if (res.code && res.raw_log)
                        throw res.raw_log;
                    return;
                }
                catch (axiosError) {
                    if (axiosError.isAxiosError && axiosError.response.status === 400) {
                        if (((_a = axiosError.response.data) === null || _a === void 0 ? void 0 : _a.code) === 3) {
                            continue;
                        }
                        else {
                            throw axiosError.response.data.message;
                        }
                    }
                    throw axiosError;
                }
            } while (Date.now() - startTime < timeout);
            throw 'Transaction wasn\'t found, timeout exceeded';
        });
    }
    simulateTransaction(tx) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const types = {
                'cosmos-sdk/MsgDelegate': '/cosmos.staking.v1beta1.MsgDelegate',
                'cosmos-sdk/MsgWithdrawDelegationReward': '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward'
            };
            const messages = tx.msgs.map(msg => {
                return Object.assign({ '@type': msg.type[0] === '/' ? msg.type : types[msg.type] }, msg.value);
            });
            const txToSimulate = {
                'tx': {
                    'body': {
                        'messages': messages,
                        'memo': tx.memo
                    },
                    'auth_info': {
                        'signer_infos': [{
                                'public_key': {
                                    '@type': '/cosmos.crypto.secp256k1.PubKey',
                                    'value': ''
                                },
                                'mode_info': {
                                    'single': {
                                        'mode': 'SIGN_MODE_UNSPECIFIED'
                                    }
                                },
                                'sequence': tx.sequence
                            }],
                        'fee': tx.fee
                    },
                    'signatures': [
                        ''
                    ]
                }
            };
            try {
                const result = (yield axios_1.default.post(`${this.host}/cosmos/tx/v1beta1/simulate`, txToSimulate)).data;
                return result.gas_info.gas_used;
            }
            catch (e) {
                if (e.isAxiosError) {
                    throw (_b = (_a = e.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message;
                }
                throw e;
            }
        });
    }
    getAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            const { account } = (yield axios_1.default.get(`${this.host}/cosmos/auth/v1beta1/accounts/${this.address}`)).data;
            return account;
        });
    }
    getChainId() {
        return __awaiter(this, void 0, void 0, function* () {
            const { node_info: { network } } = (yield axios_1.default.get(`${this.host}/node_info`)).data;
            return network;
        });
    }
}
exports.CosmosV1 = CosmosV1;
