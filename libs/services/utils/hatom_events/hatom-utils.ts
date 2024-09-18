import { Address } from "@multiversx/sdk-core/out";
import BigNumber from "bignumber.js";

export interface HatomEvent {
    [key: string]: any;
}

export function decodeTopics(properties: string[], topics: string[], types: string[]): HatomEvent {
    if (properties.length !== topics.length) {
        throw new Error("Invalid properties length");
    }

    const result: HatomEvent = {};
    for (let i = 0; i < properties.length; i++) {
        result[properties[i]] = decodeSingleTopic(topics[i], types[i]);
    }
    return result;
}

export function decodeSingleTopic(topic: string, out: string = "String"): any {
    if (out === "String") {
        return Buffer.from(topic, 'hex').toString();
    }
    if (out === "Address") {
        return Address.fromHex(topic).toBech32();
    }
    if (out === "BigNumber") {
        return new BigNumber(topic, 16);
    }
}

export function getTokenIdByMoneyMarket(moneyMarket: string) {
    switch (moneyMarket) {
        case 'erd1qqqqqqqqqqqqqpgqta0tv8d5pjzmwzshrtw62n4nww9kxtl278ssspxpxu':
            return 'HUTK-4fa4b2';
        case 'erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu':
            return 'HUSDC-d80042';
        case 'erd1qqqqqqqqqqqqqpgqvxn0cl35r74tlw2a8d794v795jrzfxyf78sstg8pjr':
            return 'HUSDT-6f0914';
        case 'erd1qqqqqqqqqqqqqpgqxmn4jlazsjp6gnec95423egatwcdfcjm78ss5q550k':
            return 'HSEGLD-c13a4e';
        case 'erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3':
            return 'HEGLD-d61095';
        case 'erd1qqqqqqqqqqqqqpgqz9pvuz22qvqxfqpk6r3rluj0u2can55c78ssgcqs00':
            return 'HWTAO-2e9136';
        case 'erd1qqqqqqqqqqqqqpgqxerzmkr80xc0qwa8vvm5ug9h8e2y7jgsqk2svevje0':
            return 'HHTM-e03ba5';
        case 'erd1qqqqqqqqqqqqqpgq8h8upp38fe9p4ny9ecvsett0usu2ep7978ssypgmrs':
            return 'HWETH-b3d17e';
        case 'erd1qqqqqqqqqqqqqpgqg47t8v5nwzvdxgf6g5jkxleuplu8y4f678ssfcg5gy':
            return 'HWBTC-49ca31';
        case 'erd1qqqqqqqqqqqqqpgqdvrqup8k9mxvhvnc7cnzkcs028u95s5378ssr9d72p':
            return 'HBUSD-ac1fca';
        case 'erd1qqqqqqqqqqqqqpgq7sspywe6e2ehy7dn5dz00ved3aa450mv78ssllmln6':
            return 'HSWTAO-6df80c';
        default:
            return "Not Found";
    }
}
