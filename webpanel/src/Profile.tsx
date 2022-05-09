import axios from 'axios';
import { Component } from 'react';
import Accordion from 'react-bootstrap/Accordion';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

import { SelectWallet, WalletItem } from './components/Wallet';
import { SelectApp, AppItem } from './components/App';
import Interval from './components/Interval';
import Telegram from './components/Telegram';

import { Wallet, App, WalletDefaultConfigs } from '../../src/types/Profile';
import { AppDescribeProfile } from '../../src/classes/App';

import AskPassword from './components/AskPassword';
import ProcessStatus from './components/ProcessStatus';
import Cryptr from "cryptr";
import zlib from "zlib";
import { TelegramConfig } from '../../src/types/TelegramConfig';

interface ProfileContext {
	wallets: Wallet[],
	apps: App[],
	interval: number,
	telegram?: {
		token: string,
		chats: string[]
	}
}

interface Context {
	wallets: WalletDefaultConfigs[],
	apps: AppDescribeProfile[],
	profile: ProfileContext,
	
	isAskPassword: boolean,
	askPasswordResolver: Function | null,
	askPasswordRejecter: Function | null,

	processText: string
}

function encrypt (cryptr: Cryptr, password: string): string {
	const hex = cryptr.encrypt(password);
	return zlib.deflateRawSync(Buffer.from(hex, 'hex')).toString('base64');
}

function decrypt (cryptr: Cryptr, base64: string): string {
	const hex = zlib.inflateRawSync(Buffer.from(base64, 'base64')).toString('hex');
	return cryptr.decrypt(hex);
}

const defaultInderval = 3600;

export default class Profile extends Component<{}, Context> {	

	//private AskPassword = new AskPassword();

	constructor() {
		super({});

		this.state = {
			wallets: [],
			apps: [],
			profile: {
				wallets: [],
				apps: [],
				interval: defaultInderval
			},
			isAskPassword: false,
			askPasswordResolver: null,
			askPasswordRejecter: null,
			processText: ''
		};

		this.addWallet = this.addWallet.bind(this);
		this.editWallet = this.editWallet.bind(this);
		this.delWallet = this.delWallet.bind(this);

		this.addApp = this.addApp.bind(this);
		this.editApp = this.editApp.bind(this);
		this.delApp = this.delApp.bind(this);

		this.editInterval = this.editInterval.bind(this);

		this.setTelegram = this.setTelegram.bind(this);

		this.download = this.download.bind(this);
		this.import = this.import.bind(this);
		this.askPassword = this.askPassword.bind(this);
		this.setProcessText = this.setProcessText.bind(this);

		axios.get('/wallets').then(({ data }) => {
			this.setState({ wallets: data });
		});

		axios.get('/apps').then(({ data }) => {
			this.setState({ apps: data });
		});
	}

	componentDidMount() {
		window.onbeforeunload = function() {
			return 'You can lose your changes!';
		};
	}

	askPassword(): Promise<string> {
		const state: any = { isAskPassword: true };
		const prom = new Promise<string>((resolve, reject) => {
			state.askPasswordResolver = resolve;
			state.askPasswordRejecter = reject;
		})
		const reset = {
			isAskPassword: false,
			askPasswordResolver: null,
			askPasswordRejecter: null
		}
		this.setState(state);
		prom.then(() => this.setState(reset)).catch(() => this.setState(reset));
		return prom;
	}

	addWallet(network_index: number) {
		if (!this.state.profile) return false;
		const wallets = this.state.wallets;
		if (typeof wallets === 'undefined') return false;
		const base = wallets[network_index];
		const wallet: Wallet = {
			network: base.network,
			config: {
				host: base.host,
				gasPrice: base.gasPrice,
				key: {
					type: '',
					value: ''
				}
			},
			triggers: [
				{
					amount: '0',
					denom: base.nativeDenom
				}
			]
		};
		this.state.profile.wallets.push(wallet);
		this.setState({
			profile: this.state.profile
		});
		return true;
	}

	editWallet(wallet_index: number, wallet: Wallet) {
		if (!this.state.profile) return false;
		if (!this.state.profile.wallets?.[wallet_index]) return false;
		const profile = this.state.profile;
		profile.wallets[wallet_index] = wallet;
		this.setState({ profile });
		return true;
	}

	delWallet(wallet_index: number) {
		if (!this.state.profile) return false;
		if (!this.state.profile.wallets?.[wallet_index]) return false;
		if (!window.confirm('Confirm removing the wallet from your config')) return false;
		const profile = this.state.profile;
		profile.wallets.splice(wallet_index, 1);
		this.setState({ profile });
		alert('Wallet was deleted');
		return true;
	}

	addApp(app_index: number) {
		if (!this.state.profile) return false;
		const apps = this.state.apps;
		if (typeof apps === 'undefined') return false;
		const base = apps[app_index];
		const app: App = {
			app: base.app,
			alias: '',
			wallets: [''],
			params: {}
		};
		this.state.profile.apps.push(app);
		this.setState({
			profile: this.state.profile
		});
		return true;
	}

	editApp(app_index: number, app: App) {
		if (!this.state.profile) return false;
		if (!this.state.profile.apps?.[app_index]) return false;
		const profile = this.state.profile;
		profile.apps[app_index] = app;
		this.setState({ profile });
		return true;
	}

	delApp(app_index: number) {
		if (!this.state.profile) return false;
		if (!this.state.profile.apps?.[app_index]) return false;
		if (!window.confirm('Confirm removing the app from your config')) return false;
		const profile = this.state.profile;
		profile.apps.splice(app_index, 1);
		this.setState({ profile });
		alert('App was deleted');
		return true;
	}

	editInterval(value: string) {
		if (!this.state.profile) return false;
		const profile = this.state.profile;
		profile.interval = parseInt(value);
		this.setState({ profile });
		return true;
	}

	setTelegram(config?: TelegramConfig) {
		if (!this.state.profile) return false;
		const profile = this.state.profile;
		if (config) {
			profile.telegram = config;
		} else {
			delete profile.telegram;
		}
		this.setState({ profile });
		return true;
	}

	setProcessText(text: string) {
		this.setState({ processText: text });
	}

	import() {
		console.log('Import');
		const that = this;

		function fillerString (value: any): string {
			if (typeof value !== 'string') return '';
			return value;
		}
		function fillerNumber (value: any): number {
			if (typeof value !== 'number') return 0;
			return value;
		}

		//this.AskPassword.show(true);

		const i = document.createElement('input');
					i.type = 'file';
					i.accept = '.json,application/json';
					i.addEventListener('change', function () {
						if (!this.files?.length) return;
						console.log('Start import');
						const fr = new FileReader();
						fr.onload = async () => {
							try {
								let json = fr.result;
								if (!json) throw new Error('Empty file');
								if (typeof json !== 'string') json = json.toString();
								const obj: any = JSON.parse(json);
								if (!obj) throw new Error('Couldn\'t parse file');

								const password = await that.askPassword();
								await new Promise(tick => setTimeout(tick, 200));
								const cryptr = new Cryptr(password);

								// Rewrite props
								const wallets: Wallet[] = [];

								that.setState({
									profile: {
										wallets: [],
										apps: [],
										interval: defaultInderval,
										telegram: undefined
									}
								});

								const interval = fillerNumber(obj.interval);

								let totalDecode = 0, currentDecode = 0;

								if (obj.wallets && obj.wallets instanceof Array) {
									for (const wallet of obj.wallets) {
										if (!wallet || typeof wallet !== 'object') continue;
										if (wallet.config.key.value) totalDecode++;
									}
								}

								if (obj.telegram) {
									if (obj.telegram.token) totalDecode++;
									totalDecode += obj.telegram.chats instanceof Array ? obj.telegram.chats.length : 0;
								}

								if (obj.wallets && obj.wallets instanceof Array) {
									for (const w of obj.wallets) {
										if (!w || typeof w !== 'object') continue;
										const wallet: Wallet = {
											id: fillerString(w.id),
											network: fillerString(w.network),
											config: {
												host: fillerString(w.config?.host),
												gasPrice: fillerNumber(w.config?.gasPrice),
												address: fillerString(w.config?.address),
												alias: fillerString(w.config?.alias),
												key: {
													type: fillerString(w.config?.key?.type),
													value: fillerString(w.config?.key?.value)
												}
											},
											triggers: []
										};
										if (wallet.config.key.value) {
											try {
												console.log('Try to decrypt', wallet);
												currentDecode++;
												that.setState({ processText: `Decrypting ${currentDecode} of ${totalDecode} secret keys, please wait...` });
												await new Promise(tick => setTimeout(tick, 50));
												wallet.config.key.value = decrypt(cryptr, wallet.config.key.value);
											} catch (e) {
												console.error(e);
												throw new Error('Failed decryption');
											}
										}
										if (w.triggers instanceof Array) {
											for (const t of w.triggers) {
												if (!t || typeof t !== 'object') continue;
												const trigger = {
													denom: fillerString(t.denom),
													amount: fillerString(t.amount)
												};
												wallet.triggers.push(trigger);
											}
										}
										wallets.push(wallet);
									}
								}

								const apps: App[] = [];

								if (obj.apps && obj.apps instanceof Array) {
									for (const a of obj.apps) {
										if (!a || typeof a !== 'object') continue;
										const app: App = {
											app: fillerString(a.app),
											alias: fillerString(a.alias),
											wallets: a.wallets instanceof Array ? a.wallets.map(fillerString).filter(Boolean) : [],
											params: a.params
										};
										apps.push(app);
									}
								}

								let telegram: TelegramConfig | undefined = undefined;

								if (obj.telegram) {
									telegram = { token: '', chats: [] };
									if (obj.telegram.token) {
										currentDecode++;
										that.setState({ processText: `Decrypting ${currentDecode} of ${totalDecode} secret keys, please wait...` });
										await new Promise(tick => setTimeout(tick, 50));
										telegram.token = decrypt(cryptr, obj.telegram.token);
									}
									if (obj.telegram.chats instanceof Array) {
										for (const chat_id of obj.telegram.chats.filter(Boolean)) {
											currentDecode++;
											that.setState({ processText: `Decrypting ${currentDecode} of ${totalDecode} secret keys, please wait...` });
											await new Promise(tick => setTimeout(tick, 50));
											telegram.chats.push(decrypt(cryptr, chat_id));
										}
									}
								}

								await new Promise(tick => setTimeout(tick, 10));

								that.setState({
									profile: {
										wallets,
										apps,
										interval,
										telegram
									}
								});
							} catch (e) {
								console.error('Failed import', e);
								alert(e);
							}
							that.setState({ processText: '' });
							i.remove();
						};
						fr.readAsText(this.files[0]);
					});
					i.click();
	}

	async download() {
		const clone = JSON.parse(JSON.stringify(this.state.profile));

		let totalEncode = 0, currentEncode = 0;

		try {

			for (const wallet of clone.wallets) {
				if (wallet.config.key.value) totalEncode++;
			}

			if (clone.telegram) {
				if (clone.telegram.token) totalEncode++;
				clone.telegram.chats = clone.telegram.chats instanceof Array ? clone.telegram.chats.filter(Boolean) : [];
				totalEncode += clone.telegram.chats.length;
			}

			if (totalEncode) {
				const password = await this.askPassword();
				await new Promise(tick => setTimeout(tick, 200));
				const cryptr = new Cryptr(password);

				for (const wallet of clone.wallets) {
					if (!wallet.config.key.value) continue;
					try {
						currentEncode++;
						this.setState({ processText: `Encrypting ${currentEncode} of ${totalEncode} secret keys, please wait...` });
						await new Promise(tick => setTimeout(tick, 50));
						wallet.config.key.value = encrypt(cryptr, wallet.config.key.value);
					} catch (e) {
						console.error(e);
						throw new Error('Failed encryption');
					}
				}

				if (clone.telegram) {
					if (clone.telegram.token) {
						currentEncode++;
						this.setState({ processText: `Encrypting ${currentEncode} of ${totalEncode} secret keys, please wait...` });
						await new Promise(tick => setTimeout(tick, 50));
						clone.telegram.token = encrypt(cryptr, clone.telegram.token);
					}
					const chats = [];
					for (const chat_id of clone.telegram.chats) {
						currentEncode++;
						this.setState({ processText: `Encrypting ${currentEncode} of ${totalEncode} secret keys, please wait...` });
						await new Promise(tick => setTimeout(tick, 50));
						chats.push(encrypt(cryptr, chat_id));
					}
					clone.telegram.chats = chats;
				}
			}

			this.setState({ processText: `Downloading...` });
			await new Promise(tick => setTimeout(tick, 50));

			const json = JSON.stringify(clone, undefined, 2);
			const file = new Blob([json], { type: 'application/json' });
			const a = document.createElement('a');
					a.href = URL.createObjectURL(file);
					a.download = 'profile_' + Date.now() + '.json';
					a.click();

		} catch (e) {
			console.error('Failed download', e);
			alert(e);
		}
		this.setState({ processText: '' });
	}

	render() {
		if (!this.state?.wallets?.length) return <i>Loading 1 / 2</i>;
		if (!this.state?.apps?.length) return <i>Loading 2 / 2</i>;
		return (<Row>
			<Col className={'mb-5'} sm={12} lg={7}>
				<AskPassword show={this.state.isAskPassword} resolve={this.state.askPasswordResolver} reject={this.state.askPasswordRejecter} />
				<ProcessStatus text={this.state.processText} />
				<Card>
					<Card.Header>Wallets <Button onClick={this.download}>Download</Button> <Button onClick={this.import}>Import</Button></Card.Header>
					<Card.Body>
						<Accordion className={'mb-3'}>
							{this.state.profile?.wallets.map((item, index) => <WalletItem index={index} data={item} onChange={this.editWallet} del={this.delWallet} />)}
						</Accordion>
						<SelectWallet list={this.state.wallets} fnAdd={this.addWallet} />
						<hr />
						<Interval value={this.state.profile.interval} onChange={this.editInterval} />
					</Card.Body>
				</Card>
			</Col>
			<Col>
				<Card border="danger">
					<Card.Header>Apps</Card.Header>
					<Card.Body>
						<Accordion className={'mb-3'}>
							{this.state.profile?.apps.map((item, index) => <AppItem index={index} data={item} apps={this.state.apps} onChange={this.editApp} del={this.delApp} />)}
						</Accordion>
						<SelectApp list={this.state.apps} fnAdd={this.addApp} />
					</Card.Body>
				</Card>

				<Card className="mt-3" border="primary">
					<Card.Header>Telegram</Card.Header>
					<Card.Body>
						<Telegram data={this.state.profile.telegram} set={this.setTelegram} setProcessText={this.setProcessText} />
					</Card.Body>
				</Card>
			</Col>
		</Row>);
	}
}