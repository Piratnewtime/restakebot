import express from 'express';
import TelegramBot from "node-telegram-bot-api";

import wallets from './classes/wallets';
import apps from './classes/apps';

import { WalletProps } from './types/Profile';

const walletsList: WalletProps[] = [];

for (const network in wallets) {
	if (!wallets[network].defaultConfig) continue;
	const wallet: WalletProps = {
		network,
		...wallets[network].defaultConfig()
	};
	walletsList.push(wallet);
}

const appsList: any[] = [];
for (const app_code in apps) {
	const app = apps[app_code];
	app.describeApp()
	appsList.push({
		app: app_code,
		...app.describeApp().toJSON()
	});
}

console.log(walletsList, appsList);

const app = express();

app.set('port', process.env.PORT || 34567);

app.disable('x-powered-by');

app.use(express.static(__dirname + '/../webpanel/build'));

app.use(express.json());

app.get('/wallets', (_req, res) => {
	res.json(walletsList);
});

app.get('/apps', (_req, res) => {
	res.json(appsList);
});

app.post('/tg', (req, res) => {
	const { token, code } = req.body;
	if (typeof token !== 'string' || !token) return res.status(400).send('Incorrect token format');
	if (typeof code !== 'string' || !code) return res.status(400).send('Incorrect code format');

	let bot: TelegramBot | null = new TelegramBot(token);

	let options: any = {
		allowed_updates: ['messages']
	}

	let to: NodeJS.Timeout;

	const ti = setInterval(() => {
		bot!.getUpdates(options).then(list => {
			for (let { update_id, message: msg } of list) {
				if (!options.offset || options.offset <= update_id) options.offset = update_id + 1;
				if (!msg || msg.text?.trim() !== code) continue;
				const chat_id = msg.chat.id.toString();
				bot!.close();
				bot = null;
				res.send(chat_id);
				clearTimeout(to);
				clearInterval(ti);
				break;
			}
		});
	}, 5000);

	to = setTimeout(() => {
		bot!.close();
		bot = null;
		res.status(408).send('');
		clearInterval(ti);
	}, 90000 * 1000); // 25 hours
});

const server = app.listen(app.get('port'), function () {
	const url = 'http://localhost:' + app.get('port');
	console.log('Express server listening on ' + url);
	require('child_process').spawn('explorer', [ url ]).on('error', () => {});
});

const shutdown = () => {
	console.log('Good Bye!');
	server.close();
	process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);