import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import React from 'react';

type IntervalProps = {
	value: number,
	onChange: (value: string) => void
}

export default function Interval (props: IntervalProps) {
    const hour = Math.round(props.value / 3600);
    const min = Math.round((props.value / 60) % 60);
    const sec = props.value % 60;
	return (<InputGroup className='mb-2'>
		<InputGroup.Text>Interval for updates (sec)</InputGroup.Text>
		<FormControl
            placeholder="Empty interval"
			value={props.value}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
				props.onChange(e.target.value);
			}}
        />
        <InputGroup.Text>{hour}h:{min}m:{sec}s</InputGroup.Text>
	</InputGroup>);
}