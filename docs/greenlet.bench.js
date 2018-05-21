import {Chart} from "chart.js";
import greenlet from "greenlet";

export class GreenletBench {

    constructor() {
    }

    createData (number, n) {
        const data = { label : number };
        const dataTypes = ["object", "string", "boolean", "array", "number"];
        for (let i = 0; i < n - 1; i++) {
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


    async timeWorker (data, stringify) {
        const n = Object.keys(data).length;
        console.log("Using worker number", data.label);

        const exampleAsyncFunc = async (data) => {
            return data;
        }

        const workerStart = performance.now();
        const worker = greenlet(exampleAsyncFunc);
        const workerTime = performance.now() - workerStart;
        
        const awaitStart = performance.now();
        if (stringify) {
            data = JSON.stringify(data);
        }

        const result = await worker(data); 
        const awaitEnd = performance.now();
        const awaitTime = awaitEnd - awaitStart;
        
        return {
            n: n,
            create : workerTime,
            await : awaitTime
        }

    };

    createChart(data, stringify) {
        if (!window.Chart) {
            return;
        }
        let suffix = "";
        if (stringify) {
        suffix = "-stringify";
        }
        const ctx = document.getElementById('chart' + suffix).getContext('2d');
        // const labels = ["create", "postMessage", "onmessage",  "terminate"];
        const colors = ["#63cc8a", "#6389cc", "#b763cc", "#cc6376", "#c6cc63", "#cc9b63", "#cc6363"]
        const labels = ["await"];

        const datasets = data.map((d, i) => {
            return {
                label: "" + d.n,
                data: [
                    //parseInt(d.create),
                    parseInt(d.await)
                ],
                backgroundColor: colors[i]
            }
        })

        const chart = new Chart(ctx, {
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

        return chart;
    }

    async runTest(stringify) {

        let suffix = "";
        if (stringify) {
            suffix = "-stringify"
        }

        const results = [];
        const dataContainer = document.getElementById("results" + suffix);
        let n = 10;
        const max = 10000000;
        let i = 1;

        while (n < max) {
            console.log("Timing worker for n", n, " stringifed? ", stringify);
            const data = this.createData(i, n);
            const result = await this.timeWorker(data, stringify);
            results.push(result);
            n = n * 10;
            i++;
        }

        return Promise.all(results).then((allResults) => {
            console.log(allResults);
            allResults.forEach((result) => {
                const resultContainer = document.createElement("div");
                resultContainer.className = "result";
                dataContainer.appendChild(resultContainer);
                resultContainer.innerHTML = JSON.stringify(result, null, 4);
            })
            
            document.getElementById("loading").style.display = "none";
            document.getElementById("data").style.display = "initial";
            document.getElementById("data-stringify").style.display = "initial";
            const chart = this.createChart(allResults, stringify);
            console.log(chart);
        })

    }

    runTests() {
        this.runTest(false).then(() => {
            this.runTest(true);
        });
    }

}


