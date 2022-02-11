# restakebot

Install this package as global:
```
npm i -g restakebot
```

This package was created to automatic reStake crypto assets in different networks:

* Cosmos Network
* Secret Network
* Akash
* Kava
* Osmosis
* Comdex

And also to notice you about every reStake transaction via **your** Telegram bot (you will need to provide a token).

> ## All private keys, Telegram token and chats' ids will be encrypted by your password!

## Step 1: initialize your profile json file
```
restakebot init
```
Then you will enter new file name, your wallets, interval for updates and Telegram token.

## Step 2: launch
```
restakebot <filename>
```

# HOW TO

### Add new wallet
`restakebot add_wallet` / `add`

### Connect Telegtam bot later
`restakebot connect_tg` / `add_tg` / `tg`

### Change password for your file
`restakebot change_password` / `repass`
Then your file will be reEncrypted.

### Encrypt a key manually
`restakebot encoder`