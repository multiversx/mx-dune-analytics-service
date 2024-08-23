import axios from 'axios';

let events = [];

const requestBody = {
"size": 5000,
"query": {
    "bool": {
    "filter": [
        {
            "range": {
                "timestamp": {
                "gte":"2024-07-24T00:00:00",
                "lt":"2024-08-23T12:00:00",
                "format": "strict_date_optional_time"
                }
            }
        },
        {
            "nested": {
                "path": "events",
                "query": {
                    "bool": {
                        "filter": [
                            {
                                "term": {
                                "events.identifier": "addLiquidity"
                                }
                            },
                            {
                                "term": {
                                    "events.address": "erd1qqqqqqqqqqqqqpgqxhgs55hpdqll93nnvf0nwnt3wmh62u692jps5wm8uj"
                                }
                            }
                        ]
                    }
                }
            }
        }
    ]
    }
    }
};

export const fetchData = async () => {
  try {
    let response = await axios.post('https://index.multiversx.com/logs/_search', requestBody, { 
        headers: { 'Content-Type': 'application/json'}
    });
    console.log(response.data);
    requestBody.query.bool.filter[1].nested.query.bool.filter[0].term['events.identifier'] = "removeLiquidity";
    response = await axios.post('https://index.multiversx.com/logs/_search', requestBody, { 
        headers: { 'Content-Type': 'application/json'}
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

fetchData();