//import fs from 'fs';
import express from 'express';
import wallets from './classes/wallets';
import apps from './classes/apps';

import { WalletProps } from './types/Profile';

const walletsList: WalletProps[] = [];

for (const network in wallets) {
	const wallet: WalletProps = {
		network
	};
	walletsList.push(wallet);
}

console.log(walletsList, apps);

const app = express();

app.set('port', process.env.PORT || 34567);

app.disable('x-powered-by');

app.use(express.static('webpanel/build'));

app.get('/wallets', (req, res) => {
	res.json(walletsList);
});

app.get('/apps', (req, res) => {
	res.send('Ok');
});

const server = app.listen(app.get('port'), function () {
	const url = 'http://localhost:' + app.get('port');
	console.log('Express server listening on ' + url);
	require('child_process').spawn('explorer', [ url ]);
});

const shutdown = () => {
	console.log('Good Bye!');
	server.close();
	process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);