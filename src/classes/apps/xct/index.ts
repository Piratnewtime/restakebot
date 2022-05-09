import BigNumber from "bignumber.js";
import clc from "cli-color";
import Web3 from "web3";
import { Contract } from 'web3-eth-contract';
import { BuildedTx } from "../../../types/BuildedTx";

import App, { AppWallet, AppWalletsAccess, IApp, AppDescription } from "../../App";

const TokenLockerAbi = require('../../../../resources/xct/TokenLocker.json');
const RewardingAbi = require('../../../../resources/xct/Rewarding.json');
const PrivateSaleAbi = require('../../../../resources/xct/PrivateSale.json');

type Params = {
	trigger?: string | number,
	privateSale1?: string | number,
	privateSale2?: string | number,
	advisors?: string | number,
	team?: string | number,
};

type Tx = {
	from: string | number;
	to: string;
	value?: number | string;
	gas: number | string;
	gasPrice: number | string;
	maxPriorityFeePerGas?: number | string;
	maxFeePerGas?: number | string;
	data?: string;
	nonce?: number;
	chainId?: number;
	chain?: string;
	hardfork?: string;
}

type ProcessOptions = {
	wallet: AppWallet,
	contract: Contract,
	data: string,
	rewards: string[]
};

export default class Xct extends App implements IApp {
	private wallets: AppWallet[];
	private web3: Web3;
	private TokenLocker: Contract;
	private Rewarding: Contract;
	private privateSaleContracts: ({ name: string, limit: number, contract: Contract })[] = [];

	constructor (private walletsAccess: AppWalletsAccess, private params: Params) {
		super();
		
		this.wallets = walletsAccess.toArray().filter(wallet => wallet.getNetwork() === 'bsc');

		if (!this.wallets.length) throw new Error('Empty BSC wallets list');

		if (typeof params.trigger === 'string') params.trigger = parseFloat(params.trigger);
		if (typeof params.privateSale1 === 'string') params.privateSale1 = parseFloat(params.privateSale1);
		if (typeof params.privateSale2 === 'string') params.privateSale2 = parseFloat(params.privateSale2);
		if (typeof params.advisors === 'string') params.advisors = parseFloat(params.advisors);
		if (typeof params.team === 'string') params.team = parseFloat(params.team);

		if (!params.trigger && !params.privateSale1 && !params.privateSale2 && !params.advisors && !params.team) throw new Error('There must be provided at least one parameter!');

		const mainConfig = this.wallets[0].getConfig();

		this.web3 = new Web3(mainConfig.host);
		this.TokenLocker = new this.web3.eth.Contract(TokenLockerAbi.abi, '0xe8670901E86818745b28C8b30B17986958fCe8Cc');
		this.Rewarding = new this.web3.eth.Contract(RewardingAbi.abi, '0xd66C4B98AEF322D4257F485d01767908C13a341a');
		if (params.privateSale1) {
			const contract = new this.web3.eth.Contract(PrivateSaleAbi.abi, '0x1bDc0247758a726f90549a640f21D9c27Ad0Cf0C');
			this.privateSaleContracts.push({ name: 'Private Sale 1', limit: params.privateSale1, contract });
		}
		if (params.privateSale2) {
			const contract = new this.web3.eth.Contract(PrivateSaleAbi.abi, '0x077Cca506C1da017b3eD50cFA0fb7B856B2B1F81');
			this.privateSaleContracts.push({ name: 'Private Sale 2', limit: params.privateSale2, contract });
		}
		if (params.advisors) {
			const contract = new this.web3.eth.Contract(PrivateSaleAbi.abi, '0xD54b7C57A7F15506Eb3BaADE44755A568e80C6BF');
			this.privateSaleContracts.push({ name: 'Advisors', limit: params.advisors, contract });
		}
		if (params.team) {
			const contract = new this.web3.eth.Contract(PrivateSaleAbi.abi, '0x58857D8b6Fe3ffCF21867178FE18975208f79724');
			this.privateSaleContracts.push({ name: 'Team', limit: params.team, contract });
		}
	}

	async start (): Promise<never> {
		while (true) {

			for (const wallet of this.wallets) {

				const owner = wallet.getAddress();

				this.log('Check wallet ' + wallet.getPublicName());

				if (this.params.trigger) {
					try {
						const rewards = parseFloat(new BigNumber(await this.Rewarding.methods.claimable(owner).call()).div(1e6).toFixed(6));
						if (rewards >= this.params.trigger) {
							this.log(clc.greenBright(`Native staking is processing! ${rewards} XCT (limit ${this.params.trigger})`));
							await this.processingTransaction({
								wallet,
								rewards: [`Native staking - ${rewards} XCT`],
								buildTx: () => this.buildTx(wallet, this.TokenLocker, this.TokenLocker.methods.restake().encodeABI())
							});
						} else {
							this.log(`Native staking is not enough: ${rewards} XCT (limit ${this.params.trigger})`);
						}
					} catch (error) {
						const previewMsg = 'Fatal error while computing native rewards!';
						this.logError(previewMsg, error);
						this.urgentNotice(wallet, previewMsg + ' ' + error);
					}
				}

				if (this.privateSaleContracts.length) {
					let counter = 0, totalClaimed = new BigNumber(0);
					for (const { name, limit, contract } of this.privateSaleContracts) {
						try {
							const rewards = parseFloat(new BigNumber(await contract.methods.calcUnlockOf(owner).call()).div(1e6).toFixed(6));
							if (rewards >= limit) {
								this.log(clc.greenBright(`Withdraw of ${name} rewards are processing! ${rewards} XCT (limit ${limit})`));
								const res = await this.processingTransaction({
									wallet,
									rewards: [`Withdraw ${name} - ${rewards} XCT`],
									buildTx: () => this.buildTx(wallet, contract, contract.methods.claim().encodeABI())
								});
								if (res) {
									counter++;
									totalClaimed = totalClaimed.plus(rewards);
								}
							} else {
								this.log(`Amount of ${name} rewards are too low: ${rewards} XCT (limit ${limit})`);
							}
						} catch (error) {
							const previewMsg = `Fatal error while computing ${name} rewards!`;
							this.logError(previewMsg, error);
							this.urgentNotice(wallet, previewMsg + ' ' + error);
						}
					}

					if (counter) {
						this.log(clc.greenBright(`Staking rewards are processing! ${totalClaimed} XCT`));
						await this.processingTransaction({
							wallet,
							rewards: [`Stake after withdrawing - ${totalClaimed} XCT`],
							buildTx: () => this.buildTx(wallet, this.TokenLocker, this.TokenLocker.methods.stake(totalClaimed.times(1e6).toFixed(0)).encodeABI())
						});
					}
				}

			}

			this.log('Done');

			await new Promise(tick => setTimeout(tick, 3600_000));
		}
	}

	async buildTx (wallet: AppWallet, contract: Contract, data: string): Promise<BuildedTx> {
		const from = wallet.getAddress();
		const config = wallet.getConfig();

		const nonce = await this.web3.eth.getTransactionCount(from, 'pending');
		const chainId = await this.web3.eth.getChainId();
		const gasPrice = config.gasPrice || new BigNumber(await this.web3.eth.getGasPrice()).times(1.1).toFixed(0);

		const tx: Tx = {
			from,
			to: contract.options.address,
			data,
			gas: '0',
			nonce,
			gasPrice,
			chainId
		};
		
		const simulated_gas = await wallet.simulateTransaction(tx);
		tx.gas = new BigNumber(simulated_gas).times(1.3).toFixed(0);

		const signedTx = await wallet.signTransaction(tx);

		return {
			tx: signedTx.rawTransaction,
			gas: parseInt(simulated_gas),
			fee: parseFloat(new BigNumber(tx.gas).times(gasPrice).div(1e18).toFixed(18))
		}
	}

	static describeApp (): AppDescription {
		const data = new AppDescription();
		data.addParamNumber('trigger');
		data.addParamNumber('privateSale1');
		data.addParamNumber('privateSale2');
		data.addParamNumber('advisors');
		data.addParamNumber('team');
		return data;
	}
}