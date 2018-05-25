# Web Worker Performance 

This repository benchmarks the cost of various aspects of Web Workers.

## Web Workers

The timing supports the following aspects of Web Worker lifecycle:

* Creation
* Termination
* onmessage - Receiving data to the worker
* postMessage - Posting data to the the worker

## Greenlet

The repository also supports benchmarking inline web workers in the form of [Jason Miller's greenlet library](https://github.com/developit/greenlet). It covers:

* await - Time for data to be transfered to and from the inline worker

# Demo

See the [GitHub pages site for this repo](https://jamesmilneruk.github.io/webworker-perf)

# License 

MIT