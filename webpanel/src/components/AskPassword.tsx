import React, { Component } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';

type Props = {
	show: boolean,
	resolve: Function | null,
	reject: Function | null
};

type State = {
	value: string
};

export default class AskPassword extends Component<Props, State> {

	constructor(props: Props) {
		super(props);

		this.state = {
			value: ''
		}

		this.resolve = this.resolve.bind(this);
		this.reject = this.reject.bind(this);
		this.onChange = this.onChange.bind(this);
	}

	resolve(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) {
		e.preventDefault();
		const value = this.state.value;
		this.setState({ value: '' });
		if (!this.props.resolve) return;
		this.props.resolve(value);
	}

	reject() {
		this.setState({ value: '' });
		if (!this.props.reject) return;
		this.props.reject('Canceled');
	}

	onChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.target.value;
		this.setState({ value });
	}

	render() {
		return (<Modal
			show={this.props.show}
			onHide={this.reject}
			backdrop="static"
			keyboard={true}
		>
			<Modal.Header closeButton>
				<Modal.Title>Password</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<Form onSubmit={this.resolve}>
					<FormControl
						type="password"
						value={this.state.value}
						onChange={this.onChange}
						autoFocus={true}
					/>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={this.reject}>
					Cancel
				</Button>
				<Button variant="warning" onClick={this.resolve}>
					Confirm
				</Button>
			</Modal.Footer>
		</Modal>);
	}
}