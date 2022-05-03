import axios from "axios";
import * as uuid from "uuid";
import { Component } from "react";
import Button from "react-bootstrap/Button";

import { TelegramConfig } from "../../../src/types/TelegramConfig";

import Input from "./Input";
import ListInputs from "./ListInputs";

type TelegramProps = {
    data?: TelegramConfig,
    set: (config?: TelegramConfig) => boolean,
    setProcessText: (text: string) => void
}

export default class Telegram extends Component<TelegramProps> {

    constructor (props: TelegramProps) {
        super(props);

        this.onChangeConfig = this.onChangeConfig.bind(this);
        this.addChat = this.addChat.bind(this);
        this.editChat = this.editChat.bind(this);
        this.delChat = this.delChat.bind(this);
        this.connectChat = this.connectChat.bind(this);
    }

    onChangeConfig (key: 'token', value: string) {
        const data = this.props.data;
        if (!data) return;
        if (key === 'token') {
            data.token = value;
        }
        this.props.set(data);
    }

    addChat () {
        const data = this.props.data;
        if (!data) return;
        data.chats.push('');
        this.props.set(data);
    }

    editChat (index: number, value: string) {
        const data = this.props.data;
        if (!data) return;
        data.chats[index] = value;
        this.props.set(data);
    }

    delChat (index: number) {
        const data = this.props.data;
        if (!data) return;
        data.chats.splice(index, 1);
        this.props.set(data);
    }

    connectChat () {
        if (!this.props.data?.token) return;

        const code = uuid.v4();

        this.props.setProcessText(`You need to send a message to your bot with text "${code}"`);

        axios.post('/tg', {
            token: this.props.data.token,
            code
        }, {
            timeout: 90000
        }).then(({ data: chat_id }) => {
            chat_id = chat_id.toString();
            this.props.setProcessText('');
            if (this.props.data?.chats.includes(chat_id)) {
                alert('Your id is already on the list');
            } else {
                alert('Your id is added on the list');
                this.props.data?.chats.push(chat_id);
                this.props.set(this.props.data);
            }
        }).catch(e => {
            this.props.setProcessText('');
            console.error(e);
            alert('Error');
        });
    }

    render () {
        if (!this.props.data) {
            return (<p className="text-center">
                <Button variant="success" onClick={() => this.props.set({ token: '', chats: [] })}>Add telegram bot</Button>
            </p>);
        }
        return (<div>
            <Input label='Token' param='token' value={this.props.data.token} onChange={this.onChangeConfig} />
            <ListInputs
                list={this.props.data.chats}
                btnText={'Add new chat id'}
                btnVariant={'success'}
                placeholder={'Empty chat id'}
                add={this.addChat}
                update={this.editChat}
                del={this.delChat}
            />
            <p className="mt-2">
                <Button variant="primary" size="sm" onClick={this.connectChat}>Connect new chat</Button>
            </p>
            <hr />
            <p style={{textAlign: 'right'}}>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => prompt('Do you want to delete the telegram bot?') && this.props.set()}
                >Delete bot</Button>
            </p>
        </div>);
    }
}