import greenlet from "greenlet";
import Chart from "chart.js";

export class WebWorkerBench {

    constructor(parentContainer) {
        this.parentContainer = parentContainer
    }

    async timeGreenlet (data, stringify) {
        const n = Object.keys(data).length;
        
        const exampleAsyncFunc = async (data, stringify) => {
            if (stringify) {
                data = JSON.parse(data);
                data = JSON.stringify(data);
            }
            return data;
        }
        const workerStart = performance.now();
        const worker = greenlet(exampleAsyncFunc);
        const workerTime = performance.now() - workerStart;
        
        const awaitStart = performance.now();
        if (stringify) {
            data = JSON.stringify(data);
        }

        const result = await worker(data, stringify); 
        const awaitEnd = performance.now();
        const awaitTime = awaitEnd - awaitStart;
        
        return {
            n: n,
            create : workerTime,
            await : awaitTime
        }

    };

    timeWorker (data, stringify) {
        const n = Object.keys(data).length;

        let workerFile = `./worker.js`;

        if (stringify) {
            workerFile = './worker-stringify.js';
        }

        return new Promise((resolve) => {
            
            const workerStart = performance.now();
            const worker = new Worker(workerFile);
            const workerTime = performance.now() - workerStart;
            
            const sendStart = performance.now();
            if (stringify) {
                data = JSON.stringify(data);
            }

            worker.postMessage({data: data});
            const sendEnd = performance.now();
            const sendTime = sendEnd - sendStart;
        
            worker.onmessage = (e) => {
                if (stringify) {
                    data = JSON.parse(e.data.data);
                }
                const onmessageTime = Date.now() - e.data.now;

                const terminateStart = performance.now();
                worker.terminate();
                const terminateTime = performance.now() - terminateStart;
                const result = {
                    n: n,
                    create : workerTime,
                    postMessage : sendTime,
                    onmessage : onmessageTime,
                    terminate: terminateTime
                }
                
                resolve(result);

            }
        })

    };

    createWorkerChart(data, stringify, chartElement) {
  
        const ctx = chartElement.getContext('2d');
        // const labels = ["create", "postMessage", "onmessage",  "terminate"];
        const colors = ["#63cc8a", "#6389cc", "#b763cc", "#cc6376", "#c6cc63", "#cc9b63", "#cc6363"]
        const labels = ["postMessage", "onmessage"];

        const datasets = data.map((d, i) => {
            return {
                label: "" + d.n,
                data: [
                    //parseInt(d.create),
                    parseInt(d.postMessage),
                    parseInt(d.onmessage),
                    //parseInt(d.terminate)
                ],
                backgroundColor: colors[i]
            }
        })

        const chart = this.createChart(ctx, labels, datasets);

        return chart;
    }

    createGreenletChart(data, stringify, chartElement) {
        const ctx = chartElement.getContext('2d');
        // const labels = ["create", "postMessage", "onmessage",  "terminate"];
        const colors = ["#63cc8a", "#6389cc", "#b763cc", "#cc6376", "#c6cc63", "#cc9b63", "#cc6363"]
        const labels = ["await"];

        let n = 1;
        const datasets = data.map((d, i) => {
            n = n * 10;
            return {
                label: "" + (n),
                data: [
                    //parseInt(d.create),
                    parseInt(d.await)
                ],
                backgroundColor: colors[i]
            }
        })

        const chart = this.createChart(ctx, labels, datasets);
        return chart;
    }

    createData(n, transferable) {

        if (transferable) {
            const arr = []
            while (arr.length < n) arr.push(parseInt(10 * Math.random(), 10));
            const typed = new Int32Array(arr);
            return typed;
        }

        const data = {};
        const dataTypes = ["object", "string", "boolean", "array", "number"];
        for (let i = 0; i < n; i++) {
            const x = dataTypes[Math.floor(Math.random()*dataTypes.length)];
            switch(x){
            case "object":
                data[i] = {};
                break;
            case "string":
                data[i] = "test";
                break;
            case "boolean":
                data[i] = false;
                break;
            case "array": 
                data[i] = [];
                break;
            case "number":
                data[i] = 1;
                break;
            }
        }
        return data;
    }

    async runTest(options) {

        const results = [];
        let n = 10;
        const max = 10000000;
        let i = 1;

        while (n < max) {
            let result;
            console.log("Timing worker for n", n, " stringifed? ", options.stringify);
            const data = this.createData(n, options.transferable);
            if (options.type === "worker") {
                result = await this.timeWorker(data, options.stringify);
            } else if (options.type === "greenlet") {
                result = await this.timeGreenlet(data, options.stringify);
            }
            results.push(result);
            n = n * 10;
            i++;
        }

        return this.createFigures(results, options);

    }

    createFigures(results, options) {
        const containers = this.createContainer();
        return Promise.all(results).then((allResults) => {
            console.log(allResults);
            containers.results.className = "result";
            allResults.forEach((result) => {
                const r = document.createElement("p");
                r.innerHTML = JSON.stringify(result, null, 4);
                containers.results.appendChild(r);
            });
            containers.chartTitle.innerText = options.label + " (values are number of object keys)"
            if (options.type === "greenlet") {
                this.createGreenletChart(allResults, options.stringify, containers.chart);
            } else if (options.type === "worker") {
                this.createWorkerChart(allResults, options.stringify, containers.chart)
            }
            this.parentContainer.appendChild(containers.container);

        });
    }

    createChart (ctx, labels, datasets) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            backgroundColor: "#ffffff",
            options: {
                scales: {
                    yAxes : [{
                        scaleLabel : {
                            display: true,
                            labelString: "Milliseconds"
                        },
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: 2000
                        }
                    }],
                    xAxes : [{
                        scaleLabel : {
                            display: true,
                            labelString: "Method"
                        }
                    }]
                }
            }
        });
    }

    createContainer() {
        const containers = {
            container : document.createElement("div"),
            chartTitle : document.createElement("h1"),
            chart : document.createElement("canvas"),
            resultTitle : document.createElement("h1"),
            results : document.createElement("div")
        }

        containers.container.appendChild(containers.chartTitle);
        containers.container.appendChild(containers.chart);
        containers.container.appendChild(containers.resultTitle);
        containers.container.appendChild(containers.results);
        return containers;
    }

    async runWorkerBenchmarks() {
        await this.runTest({type: "worker", label: "Web Worker"});
        await this.runTest({type: "worker", label : "Web Worker - Stringify", stringify: true});
        await this.runTest({type: "worker", label : "Web Worker - Transferable", transferable: true});
    }

    async runGreenletBenchmarks() {
        await this.runTest({type: "greenlet", label: "Greenlet"});
        await this.runTest({type: "greenlet", label : "Greenlet - Stringify", stringify: true});
        await this.runTest({type: "greenlet", label : "Greenlet - Transferable", transferable: true});
    }

}


