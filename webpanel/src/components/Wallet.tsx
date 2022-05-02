import React, { Component } from "react";

import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

import Input from "./Input";
import ListTriggers from "./ListTriggers";

import { Wallet, WalletDefaultConfigs } from '../../../src/types/Profile';

type SelectWalletProps = { list: WalletDefaultConfigs[], fnAdd: (network: number) => void };
type SelectWalletState = { value: number };

export class SelectWallet extends Component<SelectWalletProps, SelectWalletState> {

	constructor(props: SelectWalletProps) {
		super(props);
		this.state = {
			value: 0
		};
		this.select = this.select.bind(this);
		this.add = this.add.bind(this);
	}

	select(e: React.ChangeEvent<HTMLSelectElement>) {
		this.setState({ value: parseInt(e.target.value) });
	}

	add() {
		this.props.fnAdd(this.state.value);
	}

	render() {
		const select = (<InputGroup>
			<Form.Select onChange={this.select}>
				{this.props.list.map((item, index) => {
					return <option value={index}>{item.network.toUpperCase()}</option>
				})}
			</Form.Select>
			<Button onClick={this.add} variant="warning" id="button-add-wallet">
				Add
			</Button>
		</InputGroup>);
		return select;
	}
}

type WalletItemProps = {
	index: number,
	data: Wallet,
	onChange: (wallet_index: number, wallet: Wallet) => boolean,
	del: (wallet_index: number) => boolean
};

export class WalletItem extends Component<WalletItemProps> {

	constructor(props: WalletItemProps) {
		super(props);

		this.onChangeConfig = this.onChangeConfig.bind(this);

		this.addTrigger = this.addTrigger.bind(this);
		this.delTrigger = this.delTrigger.bind(this);
		this.changeTrigger = this.changeTrigger.bind(this);
	}

	onChangeConfig(key: 'id' | 'host' | 'gasPrice' | 'key' | 'address' | 'alias', value: string) {
		const data: Wallet = {
			id: this.props.data.id,
			network: this.props.data.network,
			config: {
				...this.props.data.config,
				key: {
					...this.props.data.config.key
				}
			},
			triggers: this.props.data.triggers.map(t => ({...t}))
		};
		value = value.trim();
		if (key === 'id') {
			data.id = value;
		} else
		if (key === 'gasPrice') {
			data.config[key] = value ? parseFloat(value) : 0;
		} else
		if (key === 'key') {
			data.config.key = {
				type: 'privateKey',
				value
			};
		} else {
			data.config[key] = value;
		}
		this.props.onChange(this.props.index, data);
	}

	addTrigger() {
		const data = this.props.data;
		data.triggers.push({ denom: '', amount: '' });
		this.props.onChange(this.props.index, data);
	}

	delTrigger(index: number) {
		const data = this.props.data;
		data.triggers.splice(index, 1);
		this.props.onChange(this.props.index, data);
	}

	changeTrigger(index: number, key: 'amount' | 'denom', value: string) {
		const data = this.props.data;
		data.triggers[index][key] = value;
		this.props.onChange(this.props.index, data);
	}

	render() {
		const id = this.props.data.id;
		const triggers = this.props.data.triggers;
		const {
			host,
			gasPrice,
			address,
			alias,
			key: {
				value: key
			}
		} = this.props.data.config;

		let title = <i>anonymous</i>;
		if (address && alias) {
			title = <span><b>{alias}</b> ({address})</span>;
		} else if (address || alias) {
			title = <b>{address || alias}</b>;
		}
		return (<Accordion.Item eventKey={this.props.index.toString()}>
			<Accordion.Header>{this.props.data.network.toUpperCase()}&nbsp;-&nbsp;{title}</Accordion.Header>
			<Accordion.Body>
				<Input label='Host' param='host' value={host} onChange={this.onChangeConfig} />
				<Input label='Gas Price' param='gasPrice' value={gasPrice.toString()} onChange={this.onChangeConfig} />
				<Input label='Private key' param='key' value={key} onChange={this.onChangeConfig} />
				<hr />
				<Input label='Address (optional)' param='address' value={address ?? ''} onChange={this.onChangeConfig} />
				<Input label='Alias (optional)' param='alias' value={alias ?? ''} onChange={this.onChangeConfig} />
				<Input label='ID (optional)' param='id' value={id ?? ''} onChange={this.onChangeConfig} />
				<hr />
				<p style={{textAlign: 'center'}}><small>Triggers</small></p>
				<ListTriggers list={triggers} add={this.addTrigger} del={this.delTrigger} update={this.changeTrigger} />
				<hr />
				<p className="text-center">
					<Button variant="danger" size="sm" onClick={() => this.props.del(this.props.index)}>Delete</Button>
				</p>
			</Accordion.Body>
		</Accordion.Item>);
	}
}