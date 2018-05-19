const createData = (number, n) => {
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


const timeWorker = (data, toString) => {
    const n = Object.keys(data).length;
    console.log("Using worker number", data.label);
    let workerFile = `./worker.js`;

    if (toString) {
        workerFile = './worker-stringify.js';
        data = JSON.stringify(data);
    }

    return new Promise((resolve) => {
        
        const workerStart = performance.now();
        const worker = new Worker(workerFile);
        const workerTime = performance.now() - workerStart;
        const sendStart = performance.now();

        worker.postMessage({data: data});
        const sendEnd = performance.now();
        const sendTime = sendEnd - sendStart;
    
        worker.onmessage = (e) => {
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

const createChart = (data, stringify) => {
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

const runTest = async (stringify) => {

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
        const data = createData(i, n);
        const result = await timeWorker(data, stringify);
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
        const chart = createChart(allResults, stringify);
        console.log(chart);
    })

}

runTest(false);
runTest(true);