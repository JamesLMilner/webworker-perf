import greenlet from "greenlet";
import Chart from "chart.js";

export class WebWorkerBenchmark {

	constructor(parentContainer) {
		// Use the passed container or just use the body element
		if (parentContainer) {
			this.parentContainer = parentContainer;
		} else {
			this.parentContainer = document.body;
		}

		// Show a loading message for users
		this.createLoading();
		
		this.chartColors = [
			"#63cc8a",
			"#6389cc", 
			"#b763cc",
			"#cc6376",
			"#c6cc63",
			"#cc9b63",
			"#cc6363",
			"#63ccc6"
		]
	}

	createLoading() {
		this.loading = document.createElement("h1");
		this.loading.style.display = "none";
		this.loading.innerHTML = "Loading results...";
		this.parentContainer.appendChild(this.loading);
	}

	load(on) {
		console.log(this.loading);
		this.loading.style.display = (on) ? "initial" : "none";
	}

	async timeGreenlet (data, stringify) {
		const n = Object.keys(data).length;
		
		// We need to include the parsing and stringification 
		// costs for the stringify branch
		const exampleAsyncFunc = async (data, stringify) => {

			if (stringify) {
				data = JSON.parse(data);
				data = JSON.stringify(data);
			}

			return data;

		}
		
		// Cost of creation
		const workerStart = performance.now();
		const worker = greenlet(exampleAsyncFunc);
		const workerTime = performance.now() - workerStart;
		
		// Total cost of sending data to the inline Worker
		// and reciving it back to the main thread
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

	}

	timeWorker (data, stringify) {
		const n = Object.keys(data).length;

		let workerFile = `./worker.js`;

		if (stringify) {
			workerFile = './worker-stringify.js';
		}

		return new Promise((resolve) => {
			
			// Cost of creation of the web worker
			const workerStart = performance.now();
			const worker = new Worker(workerFile);
			const workerTime = performance.now() - workerStart;
			
			// Cost of sending data to the web worker
			const sendStart = performance.now();
			if (stringify) {
				data = JSON.stringify(data);
			}
			worker.postMessage({data: data});
			const sendEnd = performance.now();
			const sendTime = sendEnd - sendStart;
		
			worker.onmessage = (e) => {
				// Include cost of parsing if on stringify branch
				if (stringify) {
					data = JSON.parse(e.data.data);
				}
				const onmessageTime = Date.now() - e.data.now;

				// Cost of terminating a worker on the mainthread
				const terminateStart = performance.now();
				worker.terminate();
				const terminateTime = performance.now() - terminateStart;

				// Return all the results
				const result = {
					n: n,
					create : workerTime,
					postMessage : sendTime,
					onmessage : onmessageTime,
					terminate: terminateTime
				}
				
				resolve(result);

			}
		});
	}

	createWorkerChart(data, stringify, chartElement) {
  
		const ctx = chartElement.getContext('2d');
		// const labels = ["create", "postMessage", "onmessage",  "terminate"];
		const colors = this.chartColors;
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
		const colors = this.chartColors;
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

	createTransferable(n) {
		const arr = []
		while (arr.length < n) arr.push(parseInt(10 * Math.random(), 10));
		const typed = new Int32Array(arr);
		return typed;
	}

	createObject(n) {
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

	createData(n, transferable) {
		if (transferable) {
		   return this.createTransferable(n);
		} 
		return this.createObject(n);
	}

	async runBenchmark(options) {

		const results = [];
		let n = 10;
		const max = 10000000;

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
		}

		return this.createFigures(results, options);

	}

	createFigures(results, options) {

		const containers = this.createContainer();
		return Promise.all(results).then((allResults) => {
			
			// Append all the results to the results container
			containers.results.className = "result";
			allResults.forEach((result) => {
				const row = document.createElement("p");
				row.innerHTML = JSON.stringify(result, null, 4);
				containers.results.appendChild(row);
			});
			containers.chartTitle.innerText = options.label + " (values are number of object keys)"

			// Create the chart for the data
			if (options.type === "greenlet") {
				this.createGreenletChart(allResults, options.stringify, containers.chart);
			} else if (options.type === "worker") {
				this.createWorkerChart(allResults, options.stringify, containers.chart)
			}

			// Append everything to the provided parent container
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
							suggestedMax: 500
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
		const elements = {
			container : document.createElement("div"),
			chartTitle : document.createElement("h1"),
			chart : document.createElement("canvas"),
			resultTitle : document.createElement("h1"),
			results : document.createElement("div")
		}

		elements.container.appendChild(elements.chartTitle);
		elements.container.appendChild(elements.chart);
		elements.container.appendChild(elements.resultTitle);
		elements.container.appendChild(elements.results);
		return elements;
	}

	async runWorkerBenchmarks() {
		console.log(this.load);
		this.createLoading();
		this.load(true);
		await this.runBenchmark({type: "worker", label: "Web Worker"});
		await this.runBenchmark({type: "worker", label : "Web Worker - Stringify", stringify: true});
		await this.runBenchmark({type: "worker", label : "Web Worker - Transferable", transferable: true});
		this.load(false);
		return Promise.resolve();
	}

	async runGreenletBenchmarks() {
		this.createLoading();
		this.load(true);
		await this.runBenchmark({type: "greenlet", label: "Greenlet"});
		await this.runBenchmark({type: "greenlet", label : "Greenlet - Stringify", stringify: true});
		await this.runBenchmark({type: "greenlet", label : "Greenlet - Transferable", transferable: true});
		this.load(false);
		return Promise.resolve();
	}

}


