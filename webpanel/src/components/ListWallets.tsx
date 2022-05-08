import React, { ReactElement } from 'react';
//import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
//import Input from './Input';

type ListWalletsProps = {
    list: string[],
    add: () => void,
    del: (index: number) => void,
    update: (index: number, value: string) => void
}

export default function ListWallets (props: ListWalletsProps) {
    const items: ReactElement[] = (props.list instanceof Array ? props.list : []).map(
        (id, index) => {
            return (<ListGroup.Item variant="light">
                <InputGroup>
                    <FormControl
                        placeholder="Empty wallet ID"
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
        <Button variant="warning" size="sm" onClick={props.add}>Add new wallet ID</Button>
    </ListGroup.Item>);
	return (<ListGroup>{items}</ListGroup>);
}