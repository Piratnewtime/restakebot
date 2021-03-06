
# restakebot

This package was created to automatic reStake crypto assets in different networks:

* Binance Smart Chain
* Cosmos Network
* Secret Network
* Akash
* Kava
* Osmosis
* Comdex
* Band

And also to notice you about every reStake transaction via **your** Telegram bot (you will need to provide a token).

> All private keys, Telegram token and chats' ids will be encrypted with your password!

# Requirements
1. Install **nvm** package manager
2. Install **node** version >= 15.3.0 with **nvm** _(better way)_
3. Install **npm** package manager
4. Install **restakebot** package as global: `npm i -g restakebot`

# Let's begin

### Fast method to create new config (profile) file
`restakebot init`

### Launch the bot with your file
`restakebot <filename>`

### Add new wallet
`restakebot add_wallet` / `add`

### Connect Telegtam bot later
`restakebot connect_tg` / `add_tg` / `tg`

### Change password for your file
`restakebot change_password` / `repass`
Then your file will be reEncrypted.

### Encrypt a key manually
`restakebot encoder`

# Explaining a config file.JSON

### Root scheme
``` TS
{
	wallets: Wallet[], // Your wallets for restaking or using in apps
	apps: App[], // Using applications
	interval: number, // Interval for auto restake in seconds
	telegram: TelegramConfig // (optional) Connect your Telegram bot for receiving all event
}
```

### Wallet scheme
``` TS
{
	id: string, // (optional) Unique name to get an access to this wallet for apps
	network: string, // System key of a network module
	config: Config, // Detail information for connecting to your wallet and network
	triggers: Coin[], // Limits to show when you want to restake assets
	interval: number // (optional) Personal interval for restaking for this wallet
}
```

### Wallet config scheme
``` TS
{
	host: string, // Connection to a network
	gasPrice: number, // Unit that impacts on a final price and speed of transactions
	address: string, // (optional) Will verify this address with your private key and show in logs as open view
	alias: string, // (optional) Random string to identify a wallet personally
	key: {
		type: string, // Type of a key
		value: string // Encrypted private key
	}
}
```

### Coin scheme
``` TS
{
	amount: string, // without decimals
	denom: string // native denom (not contract)
}
```

### App scheme
``` TS
{
	app: string, // System key of an app module
	alias: string, // (optional) Random string to identify events personally
	wallets: string[], // IDs of allowed wallets
	params: unknown // Configuration for an app (see description of the app)
}
```