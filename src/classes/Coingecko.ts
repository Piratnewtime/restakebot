import axios from "axios";

const host = 'https://api.coingecko.com';

type SimplePriceResponse = {
    [id in string]: {
        'usd': number
    }
}

export async function getPrice(id: string) {
    try {
        const res = await axios.get(`${host}/api/v3/simple/price?ids=${id}&vs_currencies=usd`).then(res => res.data) as SimplePriceResponse;
        return res[id].usd;
    } catch (e) {
        console.error(e);
        return null;
    }
}