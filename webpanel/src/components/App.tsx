import React, { Component, ReactElement } from "react";

import Accordion from 'react-bootstrap/Accordion';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

import Input from "./Input";
import ListWallets from "./ListWallets";

import { App } from '../../../src/types/Profile';
import { AppDescribeProfile } from '../../../src/classes/App';

type SelectAppProps = { list: AppDescribeProfile[], fnAdd: (network: number) => void };
type SelectAppState = { value: number };

export class SelectApp extends Component<SelectAppProps, SelectAppState> {

	constructor(props: SelectAppProps) {
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
					return <option value={index}>{item.app.toUpperCase()}</option>
				})}
			</Form.Select>
			<Button onClick={this.add} variant="dark" id="button-add-app">
				Add
			</Button>
		</InputGroup>);
		return select;
	}
}

type AppItemProps = {
	index: number,
	data: App,
	apps: AppDescribeProfile[]
	onChange: (app_index: number, app: App) => boolean,
	del: (app_index: number) => boolean
};

export class AppItem extends Component<AppItemProps> {

	constructor(props: AppItemProps) {
		super(props);

		this.renderProp = this.renderProp.bind(this);
		this.onChangeConfig = this.onChangeConfig.bind(this);

		this.addWalletId = this.addWalletId.bind(this);
		this.delWalletId = this.delWalletId.bind(this);
		this.changeWalletId = this.changeWalletId.bind(this);
	}

	onChangeConfig(key: string, value: string) {
		const data: App = {
			app: this.props.data.app,
			alias: this.props.data.alias,
			wallets: [...this.props.data.wallets],
			params: {...this.props.data.params}
		};
		value = value.trim();
		
		if (key.startsWith('param.')) {
			key = key.replace('param.', '');
			data.params[key] = value;
		} else
		if (key === 'alias') {
			data.alias = value;
		}
		
		this.props.onChange(this.props.index, data);
	}

	renderProp(props: { [key: string]: any }) {
		const inputs: ReactElement[] = [];
		const appConfig = this.props.apps.find(item => item.app === this.props.data.app);
		if (!appConfig) return inputs;

		for (const row of appConfig.params) {
			if (row.type === 'number') {
				const value = typeof props[row.key] === 'number' ? props[row.key] : row.defaultValue;
				inputs.push(<Input label={row.key} param={'param.' + row.key} value={value ?? ''} onChange={this.onChangeConfig} />);
			}
		}

		return inputs;
	}

	addWalletId() {
		const data = this.props.data;
		data.wallets.push('');
		this.props.onChange(this.props.index, data);
	}

	delWalletId(index: number) {
		const data = this.props.data;
		data.wallets.splice(index, 1);
		this.props.onChange(this.props.index, data);
	}

	changeWalletId(index: number, value: string) {
		const data = this.props.data;
		data.wallets[index] = value;
		this.props.onChange(this.props.index, data);
	}

	render() {
		const {
			app,
			alias,
			wallets,
			params
		} = this.props.data;

		const appConfig = this.props.apps.find(item => item.app === app);

		if (!appConfig) return <p><i>Undefined app {app}</i></p>;
		if (typeof params !== 'object') return <p><b>{app} has incorrect params</b></p>;

		const title = alias ? <b>{alias}</b> : <i>untitles</i>;
		return (<Accordion.Item eventKey={this.props.index.toString()}>
			<Accordion.Header>{app.toUpperCase()}&nbsp;-&nbsp;{title}</Accordion.Header>
			<Accordion.Body>
				<Input label='Alias (optional)' param='alias' value={alias ?? ''} onChange={this.onChangeConfig} />
				<hr />
				<b>Wallets ID</b>
				<ListWallets list={wallets} add={this.addWalletId} del={this.delWalletId} update={this.changeWalletId} />
				<hr />
				<div>
					{this.renderProp(params)}
				</div>
				<hr />
				<p className="text-center">
					<Button variant="danger" size="sm" onClick={() => this.props.del(this.props.index)}>Delete</Button>
				</p>
			</Accordion.Body>
		</Accordion.Item>);
	}
}