const axios = require('axios');
const fs = require('fs');

let events = [];

const fetchTransactions = async (requestBody, fileName) => {
    try {
        let response;
        response = await axios.post('https://index.multiversx.com/logs/_search', requestBody, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.hits.hits;
    } catch (error) {
        console.error(error);
    }
}

const fetchEvents = async () => {
    try {
        const requestBody = JSON.parse(fs.readFileSync('scripts/requestBody2.json'));

        const addLiquiditySource = await fetchTransactions(requestBody, 'scripts/eventsAddLiquidity.json');
        requestBody.query.bool.filter[1].nested.query.bool.filter[0].term['events.identifier'] = "removeLiquidity";
        const removeLiquiditySource = await fetchTransactions(requestBody, 'scripts/eventsRemoveLiquidity.json');

        let sources = addLiquiditySource.concat(removeLiquiditySource);
        sources = sources.sort((a, b) => a._source.timestamp - b._source.timestamp);
        events = sources.map(event => event._source.events).flat();
    } catch (error) {
        console.error(error);
    }
}

const sendEvents = async () => {
    try {
        await fetchEvents();
        for (let i = 0; i < events.length; i += 10) {
            const eventsChunk = events.slice(i, i + 10);
            await axios.post('http://localhost:3000/events/liquidity-webhook', eventsChunk, {
                headers: { 'Content-Type': 'application/json' }
            });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error(error);
    }
}

sendEvents();