# Task Executor

![GitHub](https://img.shields.io/github/license/golemfactory/golem-sdk-task-executor)
![npm](https://img.shields.io/npm/v/@golem-sdk/task-executor)
![node-current](https://img.shields.io/node/v/@golem-sdk/task-executor)
![npm type definitions](https://img.shields.io/npm/types/@golem-sdk/task-executor)

## What's TaskExecutor?

TaskExecutor facilitates building of applications that utilize the computational power of the Golem Network
in a transparent and efficient manner. It is a [@golem-sdk/golem-js](https://github.com/golemfactory/golem-js) based library allowing running computation tasks,
designed for batch map-reduce like scenarios.

With TaskExecutor, developers can focus on implementing their computational tasks without delving into the details of communicating
with the Golem Network or managing modules such as payments or market.

## System requirements

To use `task-executor`, it is necessary to have yagna installed, with a **minimum version requirement of v0.13.2**. Yagna is a
service that communicates and performs operations on the Golem Network, upon your requests via the SDK. You
can [follow these instructions](https://docs.golem.network/docs/creators/javascript/quickstarts/quickstart#install-yagna-2)
to set it up.

### Simplified installation steps

In order to get started and on Golem Network and obtain test GLM tokens (`tGLM`) that will allow you to build on the
test network, follow these steps:

#### Join the network as a requestor and obtain test tokens

```bash
# Join the network as a requestor
curl -sSf https://join.golem.network/as-requestor | bash -

# Start the golem node on your machine,
# you can use `daemonize` to run this in background
yagna service run

# IN SEPARATE TERMINAL (if not daemonized)
# Initialize your requestor
yagna payment init --sender --network goerli

# Request funds on the test network
yagna payment fund --network goerli

# Check the status of the funds
yagna payment status --network goerli
```

#### Obtain your `app-key` to use with TaskExecutor

If you don't have any app-keys available from `yagna app-key list`, go ahead and create one with the command below.
You will need this key in order to communicate with `yagna` from your application via `golem-js`.You can set it
as `YAGNA_APPKEY` environment variable.

```bash
yagna app-key create my-golem-app
```

## Installation

`@golem-sdk/task-executor` is available as a [NPM package](https://www.npmjs.com/package/@golem-sdk/task-executor).

```bash
npm install @golem-sdk/task-executor
```

## Building

To build a library available to the Node.js environment:

```bash
npm run build
```

This will generate production code in the `dist/` directory ready to be used in your Node.js or browser applications.

## Usage

### Hello World example

```ts
import { TaskExecutor, WorkContext } from "@golem-sdk/task-executor";

(async function main() {
  const executor = await TaskExecutor.create("golem/alpine:latest");
  try {
    const task = async (ctx: WorkContext) => (await ctx.run("echo 'Hello World'")).stdout?.toString();
    const result = await executor.run(task);
    console.log("Result:", result);
  } catch (error) {
    console.error("Computation failed:", error);
  } finally {
    await executor.shutdown();
  }
})();
```

### More examples

The [examples directory](./examples) in the repository contains various usage patterns for the TaskExecutor. You can browse
through them and learn about the recommended practices. All examples are automatically tested during our release
process.

In case you find an issue with the examples, feel free to submit
an [issue report](https://github.com/golemfactory/golem-sdk-task-executor/issues) to the repository.

You can find even more examples and tutorials in
the [JavaScript API section of the Golem Network Docs](https://docs.golem.network/docs/creators/javascript).

## Supported environments

The library is designed to work with LTS versions of Node (starting from 18)
and with browsers.

## Golem Network Market Basics

The Golem Network provides an open marketplace where anyone can join as a Provider and supply the network with their
computing power. In return for their service, they are billing Requestors (users of this library) according to the pricing
that they define.

As a Requestor, you might want to:

- control the limit price so that you're not going to over-spend your funds
- control the interactions with the providers if you have a list of the ones which you like or the ones which you would
  like to avoid

To make this easy, we provided you with a set of predefined market proposal filters, which you can combine to implement
your own market strategy (described below).

### Mid-agreement payments to the Providers for used resources

When you obtain resources from the Provider and start using them, the billing cycle will start immediately.
Since reliable service and payments are important for all actors in the Golem Network,
the library makes use of the mid-agreement payments model and implements best practices for the market, which include:

- responding and accepting debit notes for activities that last longer than 30 minutes
- issuing mid-agreement payments (pay-as-you-go)

By default, the library will:

- accept debit notes sent by the Providers within two minutes of receipt (so that the Provider knows that we're alive,
  and it will continue serving the resources)
- issue a mid-agreement payment every 12 hours (so that the provider will be paid on a regular interval for serving the
  resources for more than 10 hours)

You can learn more about
the [mid-agreement and other payment models from the official docs](https://docs.golem.network/docs/golem/payments).

These values are defaults and can be influenced by the following settings:

- `DemandOptions.expirationSec`
- `DemandOptions.debitNotesAcceptanceTimeoutSec`
- `DemandOptions.midAgreementPaymentTimeoutSec`

If you're using `TaskExecutor` to run tasks on Golem, you can pass them as part of the configuration object accepted
by `TaskExecutor.create`.

### Limit price limits to filter out offers that are too expensive

```typescript
import { TaskExecutor, ProposalFilterFactory } from "@golem-sdk/task-executor";

const executor = await TaskExecutor.create({
  // What do you want to run
  package: "golem/alpine:3.18.2",

  // How much you wish to spend
  budget: 2.0,
  proposalFilter: ProposalFilterFactory.limitPriceFilter({
    start: 1.0,
    cpuPerSec: 1.0 / 3600,
    envPerSec: 1.0 / 3600,
  }),

  // Where you want to spend
  payment: {
    network: "polygon",
  },
});
```

To learn more about other filters, please check
the [API reference of the market/strategy module](https://docs.golem.network/docs/golem-js/reference/modules/market_strategy)

### Work with reliable providers

The `getHealthyProvidersWhiteList` helper will provide you with a list of Provider ID's that were checked with basic
health-checks. Using this whitelist will increase the chance of working with a reliable provider. Please note, that you
can also build up your own list of favourite providers and use it in a similar fashion.

```typescript
import { MarketHelpers, ProposalFilterFactory, TaskExecutor } from "@golem-sdk/task-executor";

// Collect the whitelist
const verifiedProviders = await MarketHelpers.getHealthyProvidersWhiteList();

// Prepare the whitelist filter
const whiteList = ProposalFilterFactory.allowProvidersById(verifiedProviders);

// Prepare the price filter
const acceptablePrice = ProposalFilterFactory.limitPriceFilter({
  start: 1.0,
  cpuPerSec: 1.0 / 3600,
  envPerSec: 1.0 / 3600,
});

const executor = await TaskExecutor.create({
  // What do you want to run
  package: "golem/alpine:3.18.2",

  // How much you wish to spend
  budget: 2.0,
  proposalFilter: (proposal) => acceptablePrice(proposal) && whiteList(proposal),

  // Where you want to spend
  payment: {
    network: "polygon",
  },
});
```

## Debugging

The library uses the [debug](https://www.npmjs.com/package/debug) package to provide debug logs. To enable them, set the `DEBUG` environment variable to `task-executor:*` to see the related log lines. For more information, please refer to the [debug package documentation](https://www.npmjs.com/package/debug).

## Testing

Read the dedicated [testing documentation](./TESTING.md) to learn more about how to run tests of the library.

## Contributing

It is recommended to run unit tests and static code analysis before committing changes.

```bash
npm run lint
# and
npm run format
```

## See also

- [Golem](https://golem.network), a global, open-source, decentralized supercomputer that anyone can access.
- Learn what you need to know to set up your Golem requestor node:
  - [Golem JS Quickstart](https://docs.golem.network/docs/quickstarts/js-quickstart)
  - [Golem JS Examples](https://docs.golem.network/docs/creators/javascript/examples)
  - [Golem JS Tutorials](https://docs.golem.network/docs/creators/javascript/tutorials#golem-js-tutorials)
  - [Golem JS Guides](https://docs.golem.network/docs/creators/javascript/guides)
- Learn about preparing your own Docker-like images for
  the [VM runtime](https://docs.golem.network/docs/creators/javascript/examples/tools/converting-docker-image-to-golem-format)
