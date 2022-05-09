import React, { Component } from 'react';

import Modal from 'react-bootstrap/Modal';

type Props = {
	text: string
};

export default class ProcessStatus extends Component<Props> {
	render() {
		return (<Modal
			show={!!this.props.text}
			backdrop="static"
		>
			<Modal.Body>
				{this.props.text}
			</Modal.Body>
		</Modal>);
	}
}