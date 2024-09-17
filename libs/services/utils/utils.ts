import { Address } from "@multiversx/sdk-core/out";
import BigNumber from "bignumber.js";

export function joinCsvAttributes(...attributes: any[]): string {
    return attributes.join(',');
}

export function toSnakeCase(camelCaseString: string): string {
    const snakeCaseString = camelCaseString.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    return snakeCaseString;
}

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