import axios from "axios";
import Proto from "./Cosmos_v044";

export default class Cosmos_v046 extends Proto {
    async getChainId (): Promise<string> {
		const { default_node_info: { network } } = (await axios.get(`${this.host}/cosmos/base/tendermint/v1beta1/node_info`)).data;
		return network;
	}
}