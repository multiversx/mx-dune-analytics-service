REST API facade template for microservices that interacts with the MultiversX blockchain.

## Introduction

This repository features a starting point for extracting, transforming and loading MultiversX specific data into Dune Analytics. 

It includes examples on how to process different Hatom events, such as lending, borrowing and liquidation. 

It also includes a `dune simulator` that exposes the same Rest API interface as Dune Analytics, and is also able to generate charts. This will be very useful for testing.

## Installation

You might need additional packages installed on your PC in order to install all dependencies (canvas, for example).
Before running `npm install` on `MacOS` (for example), make sure you install all the packages, as following:
```
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

1. Run `npm install` in the project directory
2. Update `config/config.yaml` and/or `.env` files

## Extending or contributing

At the time of the writing, there is no official Dune account to be used, so one that will extend or integrate this project will have to create his own account and datasets.

In order to contribute, one can follow the implementation of the already integrates features. 

### Architecture

The project relies on a so-called component `event processor` (similar to `transaction processor` for those familiar with MultiversX microservices) that can return 
via a callback all the events that match the provided criteria. 

Calls to this component are triggered via `cron jobs` that will initiate data fetching at given intervals. 

All the received events are then processed by services specific to each use-case. They will make conversions, will update different fields (such as prices), and so on. 
After the processing, they will send all the processed events to an accumulator.

From time to time (by using a different `cron job`), the accumulator will push data to Dune Analytics. 

In testing phases (or when using sensitive data), there's also a different app called `dune simulator` that can receive the events and generate charts.

Let's see how we can integrate an use case.

### Use case: Hatom borrowing events

Let's follow, for example, how Hatom borrowing events processing was integrated:

1. First, we need to create a service. Have a look at the `libs/services/src/events/hatom.borrow.events.service.ts` service to see how we process events and how we send them to the accumulator.
2. Then, we need to import that service into `libs/services/src/event-processor/processor.service.ts`.
3. After that, we need to create a new cron job for this use-case. In this function, we will initialize an `event processor` instance and we'll configure the desired options:
```
@Cron(CronExpression.EVERY_10_SECONDS)
  async handleHatomBorrowEventsUSDT() {
    await Locker.lock('hatom-borrow-USDT-f8c08c', async () => {
      const eventProcessorOptions = new EventProcessorOptions({
        elasticUrl: 'https://index.multiversx.com',
        eventIdentifiers: ['borrow'],
        emitterAddresses: ['erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu'],
        pageSize: 500,
        getLastProcessedTimestamp: async () => {
          return await this.dynamicCollectionService.getLastProcessedTimestamp('hatom-borrow-USDT-f8c08c');
        },
        setLastProcessedTimestamp: async (nonce) => {
          await this.dynamicCollectionService.setLastProcessedTimestamp('hatom-borrow-USDT-f8c08c', nonce);
        },
        onEventsReceived: async (highestTimestamp, events) => {
          highestTimestamp;
          await this.hatomBorrowService.hatomBorrowParser(events as EventLog[], 'USDT-f8c08c');
        },
      });
      const eventProcessor = new EventProcessor();
      await eventProcessor.start(eventProcessorOptions);
    });
  }
```

As you can see, we want to receive all the events emitted by the address `erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu` and have the identifier `borrow`. 

Inside the functions that handle the last processed timestamps, we will store them into MongoDB for persistance. 

Inside the `onEventsReceived` function, we call our service that will further process the raw events.

For this example, since we need to query multiple addresses for getting all the `borrow` events, we can either create multiple cron jobs, either set multiple entries in `emitterAddresses`.

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

In order to simplify the scripts, we'll use the following environment variables:

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
```

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
