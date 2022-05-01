import axios from 'axios';
import { Component } from 'react';
import Accordion from 'react-bootstrap/Accordion';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

import { SelectWallet, WalletItem } from './components/Wallet';

import { Wallet, WalletProps } from '../../src/types/Profile';

import AskPassword from './components/AskPassword';
import Cryptr from "cryptr";
import zlib from "react-zlib-js";

interface ProfileContext {
	wallets: Wallet[]
}

interface Context {
	wallets?: WalletProps[],
	apps?: any,
	profile: ProfileContext,
	
	isAskPassword: boolean,
	askPasswordResolver: Function | null
	askPasswordRejecter: Function | null
}

function encrypt (cryptr: Cryptr, password: string): string {
	const hex = cryptr.encrypt(password);
	return zlib.deflateRawSync(Buffer.from(hex, 'hex')).toString('base64');
}

function decrypt (cryptr: Cryptr, base64: string): string {
	const hex = zlib.inflateRawSync(Buffer.from(base64, 'base64')).toString('hex');
	return cryptr.decrypt(hex);
}

export default class Profile extends Component<{}, Context> {	

	//private AskPassword = new AskPassword();

	constructor() {
		super({});

		this.state = {
			profile: {
				wallets: []
			},
			isAskPassword: false,
			askPasswordResolver: null,
			askPasswordRejecter: null
		};

		this.addWallet = this.addWallet.bind(this);
		this.editWallet = this.editWallet.bind(this);
		this.download = this.download.bind(this);
		this.import = this.import.bind(this);
		this.askPassword = this.askPassword.bind(this);

		axios.get('/wallets').then(({ data }) => {
			this.setState({ wallets: data });
		});
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
				host: '',
				gasPrice: 0,
				key: {
					type: '',
					value: ''
				}
			},
			triggers: []
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
								console.log('Password', password);
								const cryptr = new Cryptr(password);

								// Rewrite props
								const wallets: Wallet[] = [];

								that.setState({
									profile: {
										wallets: []
									}
								});

								if (obj.wallets && obj.wallets instanceof Array) {
									for (const w of obj.wallets) {
										if (!w || typeof w !== 'object') continue;
										const wallet: Wallet = {
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
												wallet.config.key.value = decrypt(cryptr, wallet.config.key.value);
											} catch {
												throw new Error('Incorrect password');
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

								console.log('Imported', wallets);

								await new Promise(tick => setTimeout(tick, 10));

								that.setState({
									profile: {
										wallets
									}
								});
							} catch (e) {
								console.error('Failed import', e);
								alert(e);
							}
							i.remove();
						};
						fr.readAsText(this.files[0]);
					});
					i.click();
	}

	download() {
		const json = JSON.stringify(this.state.profile, undefined, 2);
		const file = new Blob([json], { type: 'application/json' });
		const a = document.createElement('a');
				  a.href = URL.createObjectURL(file);
				  a.download = 'profile_' + Date.now() + '.json';
				  a.click();
	}

	render() {
		if (!this.state?.wallets) return <i>Loading 1 / 2</i>;
		//if (!this.state?.apps) return <i>Loading 2 / 2</i>;
		return (<Row>
			<Col className={'mb-5'} sm={12} lg={7}>
				<AskPassword show={this.state.isAskPassword} resolve={this.state.askPasswordResolver} reject={this.state.askPasswordRejecter} />
				<Card>
					<Card.Header>Wallets <Button onClick={this.download}>Save</Button> <Button onClick={this.import}>Import</Button></Card.Header>
					<Card.Body>
						<Accordion className={'mb-3'}>
							{this.state.profile?.wallets.map((item, index) => <WalletItem index={index} data={item} onChange={this.editWallet} />)}
						</Accordion>
						<SelectWallet list={this.state.wallets} fnAdd={this.addWallet} />
					</Card.Body>
				</Card>
			</Col>
			<Col>
				<Card>
					<Card.Header>Apps</Card.Header>
					<Card.Body></Card.Body>
				</Card>
			</Col>
		</Row>);
	}
}