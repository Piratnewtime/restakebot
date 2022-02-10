"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Secret {
    constructor(key, password = null) {
        this.key = key;
        this.password = password;
    }
    checkKey() {
        if (!this.password)
            return false;
        try {
            this.password.decrypt(this.key);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    getKey() {
        var _a, _b;
        return (_b = (_a = this.password) === null || _a === void 0 ? void 0 : _a.decrypt(this.key)) !== null && _b !== void 0 ? _b : this.key;
    }
}
exports.default = Secret;
//# sourceMappingURL=Secret.js.map