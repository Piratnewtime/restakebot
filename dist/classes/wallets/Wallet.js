"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Wallet {
    constructor(w, secret) {
        this.w = w;
        this.secret = secret;
        this.triggers = [];
        this.target = '';
        const config = w.config;
        this.host = config.host;
        this.gasPrice = config.gasPrice;
        this.address = config.address;
        this.nativeDenom = config.nativeDenom;
    }
    addTrigger(amount, denom = null) {
        if (denom === null)
            denom = this.nativeDenom;
        this.triggers.push({
            amount,
            denom
        });
        return this;
    }
    setTargetValidator(address) {
        this.target = address;
    }
}
exports.default = Wallet;
//# sourceMappingURL=Wallet.js.map