# XCT restake app

XCT is a BEP20 token of Citadel.One company and based on Binance Smart Chain network.

Helps to restake holded tokens and private sales tokens.

### App scheme
``` JSON
{
	"app": "xct",
	"alias": "My XCT",
	"wallets": [
		"wallet_id_bsc"
	],
	"params": {
		"trigger": 500, // (optional) Limit for native rewards >= 500 XCT
		"advisors": 100, // (optional) Limit for unlocked private sales tokens >= 100 XCT
		"privateSale1": 0,
		"privateSale2": 0,
		"team": 0
	}
}
```