REST API facade template for microservices that interacts with the MultiversX blockchain.

## Quick start

1. Run `npm install` in the project directory
2. Optionally make edits to `config/config.yaml` and/or `.env` files

## Dependencies

1. Redis Server is required to be installed [docs](https://redis.io/).
2. MySQL Server is required to be installed [docs](https://dev.mysql.com/doc/refman/8.0/en/installing.html).
3. MongoDB Server is required to be installed [docs](https://docs.mongodb.com/).

You can run `docker-compose up` (or `docker-compose up -d` as detached) in a separate terminal to use a local Docker container for all these dependencies.

After running the sample, you can stop the Docker container with `docker-compose down`

## Available Features / Modules

### `Public API`

Endpoints that can be used by anyone (public endpoints).

### `Private API`

Endpoints that are not exposed on the internet
For example: We do not want to expose our metrics and cache interactions to anyone (/metrics /cache)

### `Events Processor`

This is used to fetch specific events from index.multiversx.com, extract necessary dataset and send it to Dune via API.

### `Dune Simulator`

This is used to simulate Dune responses and behaviour, in order to verify data before making it public.

### `Grafana dashboard`

You can find a predefined Grafana dashboard with basic metrics at [http://localhost:3010](http://localhost:3010)

Use `admin` for user and password fields. Then navigate to `Dashboards` -> `Template Service`

## Available Scripts

This is a MultiversX project built on Nest.js framework.

### Environment variables

In order to simplify the scripts, the templates will use the following environment variables:

- `NODE_ENV`

**Description**: Defines the environment in which the application runs. This influences various configuration settings.

**Possible Values**: `mainnet`, `testnet`, `devnet`, `infra`

**Usage**: Determines the environment-specific configurations and behaviors of the application.

- `NODE_APP`

**Description**: Specifies which part of the application to start.

**Possible Values**: `events-processor`, `dune-simulator`

**Usage**: Selects the specific application module to run.

- `NODE_DEBUG`

**Description**: Enables or disables development debug mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in debug mode, useful for development.

- `NODE_WATCH`

**Description**: Enables or disables development watch mode.

**Possible Values**: `true`, `false`

**Usage**: When set to true, the application starts in watch mode, which automatically reloads the app on code changes.

## Running the events-processor

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=events-processor NODE_WATCH=true npm run start:events-processor

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=events-processor NODE_DEBUG=true npm run start:events-processor

## Running the dune-simulator

```bash
# development watch mode on devnet
$ NODE_ENV=devnet NODE_APP=dune-simulator NODE_WATCH=true npm run start:dune-simulator

# development debug mode on devnet
$ NODE_ENV=devnet NODE_APP=dune-simulator NODE_DEBUG=true npm run start:dune-simulator
```

### `npm run test`

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### How to start
1. start docker containers
2. start dune-simulator app (if you want to store data locally on your machine)
3. start events-processor app

### How it works
- events-processor starts fetching data from index.multiversx.com -> parse the data to 
the specified format -> store it within a csv-records class manager
- a cron job from dune-sender.service regularly check if there is any data stored in the csv-records class manager
and send the data to Dune or Dune-simulator (check .env file and specify where do you want to send the data by 
choosing between these 2 urls to initialize 'DUNE_API_URL' with: http://localhost:3001/api/v1/table or https://api.dune.com/api/v1/table ,
if you want to send data to the Dune website, please also provide in .env a valid 'DUNE_NAMESPACE' and a valid 'DUNE_API_KEY' for your Dune account)
- if the data is sent to the simulator, you can also generate some charts with it 
(make a get request in browser to the following urls:
http://localhost:3001/api/v1/table/generate/chart/:table_name/:x_axis/:y_axis/html 
                            or 
http://localhost:3001/api/v1/table/generate/chart/:table_name/:x_axis/:y_axis/png 

- table_name -> check collection name from mongoDB
- x_axis -> document field name for x_axis
- y_axis -> document field name for y_axis  )

### How to contribute
If you want to contribute to the project to create your own datasets for any events, add a new CronJob into 
the processor.service (check libs/services/event-processor/processor.service for some examples) and also create
a parser service for the events you fetch (check libs/services/src/events for some examples)
