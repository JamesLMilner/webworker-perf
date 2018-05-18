const results = [];
const createData = (number, n) => {
    const data = { label : number };
    const dataTypes = ["object", "string", "boolean", "array", "number"];
    for (let i = 0; i < n - 1; i++) {
        const x = dataTypes[Math.floor(Math.random()*dataTypes.length)];
        switch(x){
        case "object":
            data[i] = {};
        case "string":
            data[i] = "test";
        case "boolean":
            data[i] = false;
        case "array": 
            data[i] = [];
        case "number":
            data[i] = 1
        }
    }
    return data;
}


const timeWorker = (data) => {
    const n = Object.keys(data).length;
    console.log("Using worker number", data.label);
    const workerFile = `./worker.js`;

    return new Promise((resolve, reject) => {

        const asyncFunction = async (d) => { return Promise.resolve(d) };
        const promises = {};
        let currentId = 0;

        
        
        const inlineStart = performance.now();

        // The URL is a pointer to a stringified function (as a blob object)
        const objectUrl = URL.createObjectURL(new Blob([
            // Register our wrapper function as the message handler
            'onmessage=(' + (
                // userFunc() is the user-supplied async function
                userFunc => e => {
                    // Invoking within then() captures exceptions in userFunc() as rejections
                    Promise.resolve(e.data[1]).then(
                        userFunc.apply.bind(userFunc, userFunc)
                    ).then(
                        
                        // success handler - callback(id, SUCCESS(0), result)
                        d => {  postMessage([e.data[0], 0, d]);},
                        // error handler - callback(id, ERROR(1), error)
                        e => { postMessage([e.data[0], 1, ''+e]); }
                    );
                }
            ) + ')(' + asyncFunction + ')'  // pass user-supplied function to the closure
        ]))
        
        const inlineTime = performance.now() - inlineStart;

        const workerStart = performance.now();
        const worker = new Worker(objectUrl);
        const workerTime = performance.now() - workerStart;
        
        promises[++currentId] = [data];

        worker.onmessage = (e) => {
            console.log("got to onmessage");
            const onmessageTime = Date.now() - e.data.now;

            // invoke the promise's resolve() or reject() depending on whether there was an error.
            promises[e.data[0]][e.data[1]](e.data[2])

            // ... then delete the promise controller
            promises[e.data[0]] = null;

            const terminateStart = performance.now();
            worker.terminate();
            const terminateTime = performance.now() - terminateStart;
            const result = {
                n: n,
                inlineWorker : inlineTime,
                create : workerTime,
                postMessage : sendTime,
                onmessage : onmessageTime,
                terminate: terminateTime
            }
            
            resolve(result);

        }

        const sendStart = performance.now();
        worker.postMessage(data);
        const sendEnd = performance.now();
        const sendTime = sendEnd - sendStart;
        console.log("got this far")
        
    })

};

const createChart = (data) => {
    if (window.Chart) {
        const ctx = document.getElementById('chart').getContext('2d');
        const labels = ["inlineWorker", "create", "postMessage", "onmessage",  "terminate"];
        const colors = ["#763cca", "#63cc8a", "#6389cc", "#b763cc", "#cc6376", "#c6cc63", "#cc9b63", "#cc6363"]
        const datasets = data.map((d, i) => {
            return {
                label: "" + d.n,
                data: [
                    parseInt(d.create),
                    parseInt(d.postMessage),
                    parseInt(d.onmessage),
                    parseInt(d.terminate)
                ],
                backgroundColor: colors[i]
            }
        })

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            }
        });
    }
}

const runTest = async () => {
    const dataContainer = document.getElementById("results");
    let n = 10;
    const max = 10000000;
    let i = 1;

    while (n < max) {
        console.log("Timing worke for n", n)
        const data = createData(i, n);
        const result = await timeWorker(data);
        results.push(result);
        n = n * 10;
        i++;
    }
    
    Promise.all(results).then((allResults) => {
        console.log(allResults);
        allResults.forEach((result) => {
            const resultContainer = document.createElement("div");
            resultContainer.className = "result";
            dataContainer.appendChild(resultContainer);
            resultContainer.innerHTML = JSON.stringify(result, null, 4);
            
        })
        
        document.getElementById("loading").style.display = "none";
        document.getElementById("data").style.display = "initial";
        const chart = createChart(allResults);
        console.log(chart);
    })

}

runTest();