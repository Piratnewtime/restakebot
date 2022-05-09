import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Profile from './Profile';

export default function Editor () {
	return (<Row>
		<Col sm={12} lg={7}>
			<Profile />
		</Col>
		<Col>

		</Col>
	</Row>);
}