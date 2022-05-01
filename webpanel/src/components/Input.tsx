//import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
//import Button from 'react-bootstrap/Button';
import React from 'react';

type InputProps<K extends string> = {
	label: string,
	param: K,
	value: string,
	onChange: (key: K, value: string) => void
}

export default function Input<K extends string> (props: InputProps<K>) {
	return (<InputGroup className='mb-2'>
		<InputGroup.Text>{props.label}</InputGroup.Text>
		<FormControl
      placeholder="Empty"
      aria-label={props.label}
			defaultValue={props.value}
			onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
				props.onChange(props.param, e.target.value);
			}}
    />
	</InputGroup>);
}