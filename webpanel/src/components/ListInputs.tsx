import React, { ReactElement } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';

type ListInputsProps = {
    list: string[],
    btnText: string,
    btnVariant: string,
    placeholder: string,
    add: () => void,
    del: (index: number) => void,
    update: (index: number, value: string) => void
}

export default function ListInputs (props: ListInputsProps) {
    const items: ReactElement[] = (props.list instanceof Array ? props.list : []).map(
        (id, index) => {
            return (<ListGroup.Item variant="light">
                <InputGroup>
                    <FormControl
                        placeholder={props.placeholder}
                        value={id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            props.update(index, e.target.value);
                        }}
                    />
                    <Button variant="outline-secondary" onClick={() => props.del(index)}>Del</Button>
                </InputGroup>
            </ListGroup.Item>);
        }
    );
    items.push(<ListGroup.Item variant="light">
        <Button variant={props.btnVariant} size="sm" onClick={props.add}>{props.btnText}</Button>
    </ListGroup.Item>);
	return (<ListGroup>{items}</ListGroup>);
}