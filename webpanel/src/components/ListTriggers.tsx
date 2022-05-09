import React, { ReactElement } from 'react';
//import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import { Coin } from '../../../src/types/Coin';
//import Input from './Input';

type ListTriggersProps = {
    list: Coin[],
    add: () => void,
    del: (index: number) => void,
    update: (index: number, key: 'amount' | 'denom', value: string) => void
}

export default function ListTriggers (props: ListTriggersProps) {
    const items: ReactElement[] = (props.list instanceof Array ? props.list : []).map(
        (coin, index) => {
            return (<ListGroup.Item variant="light">
                <InputGroup>
                    <FormControl
                        placeholder="Empty amount"
                        type="number"
                        min={0}
                        value={coin.amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            props.update(index, 'amount', e.target.value);
                        }}
                    />
                    <FormControl
                        placeholder="Empty denom"
                        value={coin.denom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            props.update(index, 'denom', e.target.value);
                        }}
                    />
                    <Button variant="outline-secondary" onClick={() => props.del(index)}>Del</Button>
                </InputGroup>
            </ListGroup.Item>);
        }
    );
    items.push(<ListGroup.Item variant="light">
        <Button variant="warning" size="sm" onClick={props.add}>Add new trigger</Button>
    </ListGroup.Item>);
	return (<ListGroup>{items}</ListGroup>);
}