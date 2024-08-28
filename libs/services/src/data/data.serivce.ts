import { CacheInfo } from "@libs/common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import BigNumber from "bignumber.js";
import axios from 'axios';
import moment from "moment";

interface TokenPrice {
    name: string;
    identifier: string,
    price: BigNumber,
    date: moment.Moment
}

@Injectable()
export class DataService {

    constructor(
        private readonly cachingService: CacheService,
    ) { }

    async getTokenPrice(tokenId: string, date: moment.Moment): Promise<BigNumber> {
        return await this.cachingService.getOrSet(
            CacheInfo.TokenPrice(tokenId, date).key,
            async () => await this.getTokenPriceRaw(tokenId, date),
            CacheInfo.TokenPrice(tokenId, date).ttl
        );
    }

    async getTokenPriceRaw(tokenId: string, date: moment.Moment): Promise<BigNumber> {
        if (tokenId.startsWith('USDC')) {
            return (await axios.get<TokenPrice>(`https://data-api.multiversx.com/v1/quotes/cex/${tokenId}?date=${date.format('YYYY-MM-DD')}`)).data.price;
        }
        return (await axios.get<TokenPrice>(`https://data-api.multiversx.com/v1/quotes/xexchange/${tokenId}?date=${date.format('YYYY-MM-DD')}`)).data.price;
    }


    async getTokenPrecision(tokenId: string): Promise<number> {
        return await this.cachingService.getOrSet(
            CacheInfo.TokenPrecision(tokenId).key,
            async () => (await axios.get(`https://api.multiversx.com/tokens/${tokenId}?fields=decimals`)).data.decimals,
            CacheInfo.TokenPrecision(tokenId).ttl
        );
    }
}
