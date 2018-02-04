const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
	lr = new LineByLineReader('./data/StarWarsText2.txt'),
	asyncLib = require('async'),
	uuidv4 = require('uuid/v4'),
	Promise = require("bluebird");

const Planet = require('./data-classes/classes.js').Planet;
const HyperSpaceLane = require('./data-classes/classes.js').HyperSpaceLane;
const HyperSpaceNode = require('./data-classes/classes.js').HyperSpaceNode;
const Alphabets = require('./data-classes/alphabets.js');

const writeToDatabaseGlobal = true;
const DatabaseLinks = require('docker-links').parseLinks(process.env);
console.log("DatabaseLinks: ", DatabaseLinks);


// let DatabaseController;


let systemsNotInAppendix = 0;


// if(DatabaseLinks.hasOwnProperty('mongo')) {
// 	console.log("Using mongo...");
// 	DatabaseController = require('./controllers/mongo-controller.js');
// 	Promise.promisifyAll(DatabaseController);
// } else if(DatabaseLinks.hasOwnProperty('dynamodb')) {
// 	console.log("Using dynamo...");
// 	DatabaseController = require('./controllers/dynamo-controller.js');
// } else {
// 	console.log("No database selected. Exiting!");
// 	process.exit(1);
// }


const MongoController = require('./controllers/mongo-async-controller.js');


const LineReader = (writeToDatabase) => {
	return {
		lineCount: 0,
		masterPlanetArray : [],
		nonPlanetFound: 0,

		readLine(line) {

			this.lineCount++;
			console.log("current line: ", this.lineCount);
			var systemValue = line.slice(0, 44).trim().replace(/\\/g, '');
			var sectorValue = line.slice(44, 67).trim().replace(/\(/g,'/').replace(/\)/g,'').split('/');
			var regionValue = line.slice(67, line.length - 11).trim();
			var coordinatesValue = line.slice(line.length - 11, line.length).trim();
			var notAPlanet = (
				line.search('Lucasfilm') > -1 ||
				line.search('SYSTEM') > -1 ||
				line.length <= 1 ||
				coordinatesValue === "" ||
				coordinatesValue === "Appendix"
			);
			if(notAPlanet) {
				this.nonPlanetFound++;
			} else {
				var TempPlanet = new Planet(systemValue, sectorValue, regionValue, coordinatesValue);
				this.masterPlanetArray.push(TempPlanet);
				if(writeToDatabase) {
					// DatabaseController.createPlanet(TempPlanet);

					MongoController.createPlanet(TempPlanet).then(PlanetData => {
						// console.log("Planet Created: ", PlanetData);
					}).catch(err => {
						console.log("Planet Creation error: ", err);
					});
				}
			}
		},

		analyzeData(searchTermObject) {
			console.log("Started analyzeData...");
			var coordinateSet = new Set();
			var coordinateSetLetter = new Set();
			var coordinateSetNumber = new Set();
			var systemSet = new Set();
			var sectorSet = new Set();
			var regionSet = new Set();
			for(var i=0; i < this.masterPlanetArray.length; i++) {
				var currentPlanet = this.masterPlanetArray[i];
				var currentCoordinates = currentPlanet.coordinates;
				var currentSystem = currentPlanet.system;
				var currentCoordinateLetter = currentCoordinates.split('-')[0];
				var currentCoordinateNumber = currentCoordinates.split('-')[1];
				var currentCoordinateNumberInteger = parseInt(currentCoordinateNumber);
				var letters = /^[A-Z]+$/;

				if(currentCoordinateLetter.match(letters)) {
					coordinateSetLetter.add(currentCoordinateLetter);
				} else {
					// console.log("bad coordinate number");
				}
				for(var j=0; j < currentPlanet.sector.length; j++) {
					sectorSet.add(currentPlanet.sector[j]);
				}
				if(!isNaN(currentCoordinateNumberInteger)) {
					coordinateSetNumber.add(currentCoordinateNumberInteger);
				}
				systemSet.add(currentSystem);
				regionSet.add(currentPlanet.region);
			}
			for(let coordinateLetter of coordinateSetLetter) {
				for(let coordinateNumber of coordinateSetNumber) {
					const gridCoordinate = coordinateLetter + coordinateNumber;
					coordinateSet.add(gridCoordinate);
				}
			}
			for (let coordinateTempValue of coordinateSet) {
				if(writeToDatabase) {
					// DatabaseController.createCoordinate(coordinateTempValue);


					MongoController.createCoordinate(coordinateTempValue).then(CoordinateData => {
						// console.log("Coordinates created: ", CoordinateData);
					}).catch(CoordinateError => {
						console.log("Coordinates error: ", CoordinateError);
					});
				}
			}
	    console.log("Number of coordinates: ", coordinateSet.size);
	    console.log("Number of Letter coordinates: ", coordinateSetLetter.size);
	    console.log("Number of Number coordinates: ", coordinateSetNumber.size);
	    console.log("Total number of sectors: ", sectorSet.size);
	    console.log("Total number of regions: ", regionSet.size);
	    console.log("Number of systems: ", systemSet.size);
	    console.log("Total Planets: ", this.masterPlanetArray.length);
	    var regionFoundIndex = _.findIndex(this.masterPlanetArray, function(o) { return o.region === searchTermObject.region; });
	    var systemFoundIndex = _.findIndex(this.masterPlanetArray, function(o) { return o.system === searchTermObject.system; });
			var resultsRegion = _.filter(this.masterPlanetArray,function(item){
		    	return item.region.indexOf(searchTermObject.region) > -1;
		    });
			var resultsSystem = _.filter(this.masterPlanetArray,function(item){
		    	return item.system.indexOf(searchTermObject.system) > -1;
		    });
			var resultsCoordiantes = _.filter(this.masterPlanetArray,function(item){
		    	return item.coordinates.indexOf(searchTermObject.coordinates) > -1;
		    });
			if(resultsRegion.length > 0) {
				// console.log("resultsRegion: ", resultsRegion);
			}

			if(resultsSystem.length > 0) {
				// console.log("resultsSystem: ", resultsSystem);
			}
			if(resultsCoordiantes.length > 0) {
				console.log("resultsCoordiantes: ", resultsCoordiantes);
			}
	    console.log("\n\nresultsRegion: ", resultsRegion.length);
	    console.log('resultsCoordiantes: ', resultsCoordiantes.length);
	    console.log("resultsSystem: ", resultsSystem);
	    console.log("systemFoundIndex: ", systemFoundIndex);
	    console.log("regionFoundIndex: ", regionFoundIndex);

	    for(let currentSector of sectorSet) {
				// DatabaseController.createSector(currentSector);


				MongoController.createSector(currentSector).then(SectorData => {
					// console.log("SectorData: ", SectorData);
				}).catch(SectorError => {
					console.log("SectorError: ", SectorError);
				});
	    }
		},
	}
};

const loadDatabase = () => {
	// DatabaseController.connectToDatabase(function(errorConnect, resultConnect) {


	MongoController.connectToMongo().then(resultConnect => {

		console.log("Starting database loading: ", resultConnect);
		console.log("Starting collections: ", resultConnect.database.collections);

		resultConnect.database.collections.hyperspacenodemodels.createIndex({
			"loc": "2d"
		}, {
			min: [-180.00, -90.00],
			max: [180.00, 90.00]
		});

	  console.log("created 2d index on hyperspacenodemodels");
		const LineReaderMasterObject = LineReader(writeToDatabaseGlobal);

		lr.on('error', function (err) {
			// 'err' contains error object
			console.log("lr error: ", err);
		});

		lr.on('line', function (line) {
			// 'line' contains the current line without the trailing newline character.
			LineReaderMasterObject.readLine(line);
		});

		lr.on('end', function () {
			
			console.log("Total Planets: ", LineReaderMasterObject.masterPlanetArray.length);
			console.log("Non Planet Bullshit found: ", LineReaderMasterObject.nonPlanetFound);

			LineReaderMasterObject.analyzeData({
				region: 'Core Worlds',
				system: 'Coruscant',
			});

			console.log("LineReaderMasterObject Line Count: ", LineReaderMasterObject.lineCount);

			if(writeToDatabaseGlobal) {

				getCoordinatesFromGeoJsonAsync().then(CoordinateData => {

					console.log("Coordinates from geojson success!");

					loadHyperspaceLanes(function(errorHyperspace) {

						console.log("Hyperspace Lane loading error: ", errorHyperspace);



						getDatabaseStatsAsync().then(() => {
							console.log("database stats displayed");
							process.exit(1);
						}).catch(errorStats => {
							console.log("error displaying database stats: ", errorStats);
						});


					});



				}).catch(error => {
					console.log("error: ", error);
				});






				// getCoordinatesFromGeoJson(function(error) {
				// 	if(error) {
				// 		console.log("error: ", error);
				// 	} else {
				// 		console.log("No error loading planet data!");
				// 		loadHyperspaceLanes(function(errorHyperspace) {

				// 		});
				// 	}
				// });


			}
		});
	}).catch(errorConnect => {
		console.log("error connecting to the mongo database: ", errorConnect);
	});
};

// function getDatabaseStats() {
// 	DatabaseController.totalPlanets();
// 	DatabaseController.totalCoordinates();
// 	DatabaseController.totalPlanetsHasLocation();
// 	DatabaseController.totalSectors();
// 	DatabaseController.totalHyperspaceNodes();
// 	DatabaseController.totalHyperspaceLanes();
// };



async function getDatabaseStatsAsync() {
	try {
		const TotalPlanets = await MongoController.totalPlanets();
		const TotalCoordinates = await MongoController.totalCoordinates();
		const TotalPlanetsWithLocation = await MongoController.totalPlanetsHasLocation();
		const TotalSectors = await MongoController.totalSectors();
		const TotalHyperspaceNodes = await MongoController.totalHyperspaceNodes();
		const TotalHyperspaceLanes = await MongoController.totalHyperspaceLanes();

		console.log("Total Planets: ", TotalPlanets);
		console.log("Total Coordinates: ", TotalCoordinates);
		console.log("Total Planets with Location: ", TotalPlanetsWithLocation);
		console.log("Total Sectors: ", TotalSectors);
		console.log("Total Hyperspace Nodes: ", TotalHyperspaceNodes);
		console.log("Total Hyperspace Lanes: ", TotalHyperspaceLanes);

	} catch(err) {
		throw new Error(err);
	}
};

// function getCoordinatesFromGeoJson(callback) {
// 	console.log("getCoordinatesFromGeoJson has fired!");
// 	const Planets = JSON.parse(fs.readFileSync('./data/planets.geojson', 'utf8'));
// 	asyncLib.eachLimit(Planets.features, 5, loadPlanet, function(err){
// 		console.log("async each done!");
// 		if(err) {
// 			console.log("Error loading planet data: ", err);
// 			callback(err);
// 		} else {
// 			console.log("Planet data loaded! Total planets in planets.geojson: ", Planets.features.length);
// 			callback(null);
// 		}
// 	});
// };

function getCoordinatesFromGeoJsonAsync() {
	console.log("getCoordinatesFromGeoJson has fired!");
	const Planets = JSON.parse(fs.readFileSync('./data/planets.geojson', 'utf8'));
  return Promise.map(Planets.features, planet => { 
    return loadPlanetAsync(planet);
  }, 
    {
      concurrency: 5
    }
  );
};

async function loadPlanetAsync(planet) {
	try {
		const system = planet.properties.name;
		const sector = [planet.properties.sector];
		const region = planet.properties.region;
		const coordinates = planet.properties.grid;
		const xGalactic = planet.properties.x;
		const yGalactic = planet.properties.y;
		const xGalacticLong = planet.properties.point_x;
		const yGalacticLong = planet.properties.point_y;
		const LngLat = planet.geometry.coordinates;
		const zoom = planet.properties.zm;
		const link = planet.properties.link;
		const lat = planet.geometry.coordinates[1];
		const lng = planet.geometry.coordinates[0];
		const hasLocation = true;
		const FocusedPlanet = new Planet(
			system,
			sector,
			region,
			coordinates,
			xGalactic,
			yGalactic,
			xGalacticLong,
			yGalacticLong,
			hasLocation,
			LngLat,
			lng,
			lat,
			zoom,
			link
		);

		// console.log("FocusedPlanet: ", FocusedPlanet);
		const doc = await MongoController.findPlanetAndUpdate({system: system}, FocusedPlanet);
		if(doc === null) {
			const PlanetAdded = await MongoController.createPlanet(FocusedPlanet);
			systemsNotInAppendix++;
			return true;
		} else {
			return true;
		}

	} catch(err) {
		console.log("error loading planet: ", err);
		throw new Error(err);
	}
};

// function loadPlanet(planet, cb) {
// 	const system = planet.properties.name;
// 	const sector = [planet.properties.sector];
// 	const region = planet.properties.region;
// 	const coordinates = planet.properties.grid;
// 	const xGalactic = planet.properties.x;
// 	const yGalactic = planet.properties.y;
// 	const xGalacticLong = planet.properties.point_x;
// 	const yGalacticLong = planet.properties.point_y;
// 	const LngLat = planet.geometry.coordinates;
// 	const zoom = planet.properties.zm;
// 	const link = planet.properties.link;
// 	const lat = planet.geometry.coordinates[1];
// 	const lng = planet.geometry.coordinates[0];
// 	const hasLocation = true;
// 	const FocusedPlanet = new Planet(
// 		system,
// 		sector,
// 		region,
// 		coordinates,
// 		xGalactic,
// 		yGalactic,
// 		xGalacticLong,
// 		yGalacticLong,
// 		hasLocation,
// 		LngLat,
// 		lng,
// 		lat,
// 		zoom,
// 		link
// 	);

// 	console.log("FocusedPlanet: ", FocusedPlanet);

// 	DatabaseController.findPlanetAndUpdate({system: system}, FocusedPlanet, function(err, doc){
// 		if(err) {
// 			console.log("err: ", err);
// 			cb(err, {});
// 		} else if(doc === null) {
// 			cb(null, false);

// 			DatabaseController.createPlanet(FocusedPlanet);
// 			systemsNotInAppendix++;
// 		} else {
// 			cb(null, true);
// 		}
// 	});
// };

function loadHyperspaceLanes(cb) {
	console.log("loading hyperspace lanes...");
	const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));
	let totalHyperspaceLanes = 0;
	let totalPlanetToPlanetLanes = 0;
	let totalPlanetToEmptyLanes = 0;
	let totalEmptyToEmptyLanes = 0;

	asyncLib.eachSeries(HyperspaceLanes.features, function(hyperspaceLane, callbackEach) {

		console.log("async each series start");

		let hyperspaceLaneProps = hyperspaceLane.properties;
		let hyperspaceCoordinates = _.flattenDepth(hyperspaceLane.geometry.coordinates, 1);
		let startCoordinates = hyperspaceCoordinates[0];
		let startCoordinatesLat = startCoordinates[1];
		let startCoordinatesLng = startCoordinates[0];
		let Start = {
			lat: startCoordinatesLat,
			lng: startCoordinatesLng
		};
		let endCoordintes = hyperspaceCoordinates[ hyperspaceCoordinates.length - 1 ];
		let endCoordintesLat = endCoordintes[1];
		let endCoordintesLng = endCoordintes[0];
		let End = {
			lat: endCoordintesLat,
			lng: endCoordintesLng
		};
		let startSystem, endSystem;


		asyncLib.parallel([
			function(callback) {



				MongoController.findOnePlanet({LngLat: startCoordinates}).then(res => {

					console.log("res: ", res);


					if(res.doc && res.status) {
						// console.log("Found planet: ", res2.doc.system);
						callback(null, res);
					} else {
						MongoController.findOneHyperspaceNodeAsync({lat: Start.lat, lng: Start.lng}).then(resultNode => {
							console.log("resultNode: ", resultNode);
							callback(null, resultNode);
						}).catch(errorNode => {
							console.log("errorNode: ", errorNode);
							callback(errorNode, null);							
						});
					}
				}).catch(err => {
					callback(err, null);
				});




				// DatabaseController.findOnePlanet({LngLat: startCoordinates}, function(err, res) {
				// 	// (res.doc)? console.log("res found doc: ", res) : console.log("res did not find doc: ", res);
				// 	if(err) {
				// 		callback(err, null);
				// 	} else if(res.doc && res.status) {
				// 		// console.log("Found planet: ", res.doc.system);
				// 		callback(null, res);
				// 	} else {
				// 		DatabaseController.findOneHyperspaceNode({lat: Start.lat, lng: Start.lng}, function(errorNode, resultNode) {
				// 			if(errorNode) {
				// 				console.log("errorNode: ", errorNode);
				// 				callback(errorNode, null);
				// 			} else {
				// 				// console.log("resultNode: ", resultNode);
				// 				callback(null, resultNode);
				// 			}
				// 		});
				// 	}
				// });



			}, function(callback) {


				// DatabaseController.findOnePlanet({LngLat: endCoordintes}, function(err2, res2) {
				// 	// (res2.doc)? console.log("res2 found doc: ", res2) : console.log("res2 did not find doc: ", res2);
				// 	if(err2) {
				// 		callback(err2, null);
				// 	} else if(res2.doc && res2.status) {
				// 		// console.log("Found planet: ", res2.doc.system);
				// 		callback(null, res2);
				// 	} else {
				// 		DatabaseController.findOneHyperspaceNode({lat: End.lat, lng: End.lng}, function(errorNode, resultNode) {
				// 			if(errorNode) {
				// 				console.log("errorNode: ", errorNode);
				// 				callback(errorNode, null);
				// 			} else {
				// 				// console.log("resultNode2: ", resultNode);
				// 				callback(null, resultNode);
				// 			}
				// 		});
				// 	}
				// });


				MongoController.findOnePlanet({LngLat: endCoordintes}).then(res2 => {


					console.log("res2: ", res2);

					if(res2.doc && res2.status) {
						// console.log("Found planet: ", res2.doc.system);
						callback(null, res2);
					} else {

						MongoController.findOneHyperspaceNodeAsync({lat: End.lat, lng: End.lng}).then(resultNode => {
							console.log("resultNode: ", resultNode);
							callback(null, resultNode);
						}).catch(errorNode => {
							console.log("errorNode: ", errorNode);
							callback(errorNode, null);							
						});
					}
				}).catch(err2 => {
					callback(err2, null);
				});





			}
		], function(error, results) {

			console.log("async parallel 1 end");


			if(error) {
				callbackEach(error);
			}
			const firstResult = results[0];
			const secondResult = results[1];

			console.log("results: ", results);
			// console.log("firstResult: ", firstResult);
			// console.log("secondResult: ", secondResult);



			const firstResultFound = (firstResult && _.has(firstResult, 'status'))? true : false;
			const secondResultFound = (secondResult && _.has(secondResult, 'status'))? true : false;



			let systemA = (firstResultFound)? firstResult.doc.system : null;
			let systemB = (secondResultFound)? secondResult.doc.system : null;
			const systemALat = (firstResultFound)? firstResult.doc.lat : Start.lat;
			const systemALng = (firstResultFound)? firstResult.doc.lng : Start.lng;
			const systemBLat = (secondResultFound)? secondResult.doc.lat : End.lat;
			const systemBLng = (secondResultFound)? secondResult.doc.lng : End.lng;
			let systemAGalacticX = (firstResultFound)? firstResult.doc.xGalacticLong : null;
			let systemAGalacticY = (firstResultFound)? firstResult.doc.yGalacticLong : null;
			let systemBGalacticX = (secondResultFound)? secondResult.doc.xGalacticLong : null;
			let systemBGalacticY = (secondResultFound)? secondResult.doc.yGalacticLong : null;

			if(hyperspaceLaneProps.hyperspace === null) {
				hyperspaceLaneProps.hyperspace = Alphabets.findLaneName();
			}
			if(systemA === null) {
				systemA = Alphabets.findNodeName();
				if(systemALat) { systemAGalacticY = getGalacticYFromLatitude(systemALat) }
				if(systemALng) { systemAGalacticX = getGalacticXFromLongitude(systemALng) }

				// console.log("Creating hyperspace node A: ", systemA);
	 		}
	 		if(systemB === null) {
				systemB = Alphabets.findNodeName();
				if(systemBLat) { systemBGalacticY = getGalacticYFromLatitude(systemBLat) }
				if(systemBLng) { systemBGalacticX = getGalacticXFromLongitude(systemBLng) }
				// console.log("Creating hyperspace node B: ", systemB);
	 		}
			// console.log("\nHyperspace Node A: ", systemA);
			// console.log("systemALat: ", systemALat);
			// console.log("systemALng: ", systemALng);
			// console.log("Hyperspace Node B: ", systemB);
			// console.log("systemBLat: ", systemBLat);
			// console.log("systemBLng: ", systemBLng);
			// console.log("\n");
			if(firstResultFound && secondResultFound) {
				totalPlanetToPlanetLanes += 1;
			} else if(firstResultFound || secondResultFound) {
				totalPlanetToEmptyLanes += 1;
			} else {
				totalEmptyToEmptyLanes += 1;
			}

			console.log("async parallel 2 start");

			asyncLib.parallel([
		    function(callbackNode) {


     //    	DatabaseController.createHyperspaceNode({
					// 	system: systemA,
					// 	lat: systemALat,
					// 	lng: systemALng,
					// 	xGalacticLong: systemAGalacticX,
					// 	yGalacticLong: systemAGalacticY,
					// 	hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
					// 	nodeId: genRandFiveDigit(),
					// 	loc: [systemALng, systemALat]
					// }, function(errorNode, resultNode) {
					// 	if(errorNode) {
					// 		console.log("Node creation error: ", errorNode);
					// 		callbackNode(errorNode, resultNode);
					// 	} else {
					// 		callbackNode(null, resultNode);
					// 	}	
					// });


					MongoController.createHyperspaceNodeAsync({
						system: systemA,
						lat: systemALat,
						lng: systemALng,
						xGalacticLong: systemAGalacticX,
						yGalacticLong: systemAGalacticY,
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
						nodeId: genRandFiveDigit(),
						loc: [systemALng, systemALat]
					}).then(resultNode => {
						callbackNode(null, resultNode);
					}).catch(errorNode => {
						console.log("Node creation error: ", errorNode);
						callbackNode(errorNode);
					});


		    },
		    function(callbackNode) {

		   //  	DatabaseController.createHyperspaceNode({
					// 	system: systemB,
					// 	lat: systemBLat,
					// 	lng: systemBLng,
					// 	xGalacticLong: systemBGalacticX,
					// 	yGalacticLong: systemBGalacticY,
					// 	hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
					// 	nodeId: genRandFiveDigit(),
					// 	loc: [systemBLng, systemBLat]
					// }, function(errorNode, resultNode) {
					// 	if(errorNode) {
					// 		console.log("Node creation error: ", errorNode);
					// 		callbackNode(errorNode);
					// 	} else {
					// 		callbackNode(null, resultNode);
					// 	}
					// });


					MongoController.createHyperspaceNodeAsync({
						system: systemB,
						lat: systemBLat,
						lng: systemBLng,
						xGalacticLong: systemBGalacticX,
						yGalacticLong: systemBGalacticY,
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
						nodeId: genRandFiveDigit(),
						loc: [systemBLng, systemBLat]
					}).then(resultNode => {
						callbackNode(null, resultNode);
					}).catch(errorNode => {
						console.log("Node creation error: ", errorNode);
						callbackNode(errorNode);
					});

		    }],
			function(errorCreate, resultsCreate) {

				console.log("async each parallel 2 end");

				// console.log("resultsCreate: ", resultsCreate);
				// console.log("errorCreate: ", errorCreate);

				

		    if(errorCreate) {
		    	callbackEach(errorCreate);
		    } else {
		    	let startSystem = resultsCreate[0];
		    	let endSystem = resultsCreate[1];

		    	const startSystemFound = !_.isEmpty(startSystem);
					const endSystemFound = !_.isEmpty(endSystem);

		    	if(startSystemFound) {
		    		// console.log("startSystem: ", startSystem);
		    		Alphabets.backOneNodeName();
		    	}
		    	if(endSystemFound) {
		    		// console.log("endSystem: ", endSystem);
		    		Alphabets.backOneNodeName();
		    	}
		    	const startSystemName = (startSystemFound)? startSystem.system : systemA;
		    	const endSystemName = (endSystemFound)? endSystem.system : systemB;
		    	const hyperspaceHash = uuidv4();
		    	const SpaceLane = new HyperSpaceLane(
						hyperspaceLaneProps.hyperspace,  // name
						hyperspaceHash, // hyperspaceHash
						startSystemName, // start
						endSystemName, // end
						startCoordinates, // startCoordinates
						endCoordintes, // endCoordintes
						hyperspaceLaneProps.length, // length
						hyperspaceLaneProps.link, // link
						null, // Start Node
						null, // End Node
						hyperspaceCoordinates
					);
					totalHyperspaceLanes += 1;
		   //  	DatabaseController.createHyperspaceLane(SpaceLane, function(errorCreate, resultCreate) {
					// 	if(errorCreate) {
					// 		callbackEach(errorCreate);
					// 	} else {
					// 		callbackEach(null);
					// 	}
					// });

					// console.log("SpaceLane: ", SpaceLane);

					MongoController.createHyperspaceLane(SpaceLane).then(resultCreate => {
						callbackEach(null);
					}).catch(errorCreate => {
						callbackEach(errorCreate);
					});
	    	}
			});
		});
	}, function(errorEach) {

			console.log("async each series done");


		if(errorEach) {
			console.log("Error setting up hyperspace lanes: ", errorEach);
		}


		// hyperlaneCorrection(function(laneCorrectionError, laneCorrectionResult) {
		// 	console.log("laneCorrectionError: ", laneCorrectionError);
		// 	console.log("laneCorrectionResult: ", laneCorrectionResult);
		// 	console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
		// 	console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);
		// 	console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
		// 	console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);
		// 	console.log("Planets not in the Appendix: ", systemsNotInAppendix);
		// 	// getDatabaseStats();
		// 	getDatabaseStatsAsync().then(() => {
		// 		console.log("database stats displayed");
		// 	}).catch(errorStats => {
		// 		console.log("error displaying database stats: ", errorStats);
		// 	});
		// 	console.log("DatabaseController: ", DatabaseController);
		// 	cb(errorEach);
		// });
		console.log("Total hyperspace lanes: ", HyperspaceLanes.features.length);

		cb(errorEach);

			// getDatabaseStatsAsync().then(() => {
			// 	console.log("database stats displayed");

			// 	console.log("Total hyperspace lanes: ", HyperspaceLanes.features.length);
			// 	cb(errorEach);
			// }).catch(errorStats => {
			// 	console.log("error displaying database stats: ", errorStats);
			// 	cb(errorStats);
			// });


		// hyperlaneCorrectionAsync().then(laneCorrectionResult => {
		// 	console.log("laneCorrectionResult: ", laneCorrectionResult);
		// 	console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
		// 	console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);
		// 	console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
		// 	console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);
		// 	console.log("Planets not in the Appendix: ", systemsNotInAppendix);
		// 	// getDatabaseStats();
		// 	getDatabaseStatsAsync().then(() => {
		// 		console.log("database stats displayed");
		// 		cb(errorEach);
		// 	}).catch(errorStats => {
		// 		console.log("error displaying database stats: ", errorStats);
		// 		cb(errorStats);
		// 	});
		// }).catch(laneCorrectionError => {
		// 	console.log("laneCorrectionError: ", laneCorrectionError);
		// 	cb(laneCorrectionError);
		// });

	});
}

// function hyperlaneCorrection(cb) {
// 	DatabaseController.getAllHyperspaceLanes(function(error, result) {
// 		if(error) {
// 			console.log("error getting all hyperspace lanes: ", error);
// 			cb(error, null);
// 		} else {
// 			console.log("total hyperspace lanes: ", result.length);
// 			asyncLib.filterLimit(result, 2, validateLaneNodes, function(err, results) {
// 		    console.log("err: ", err);
// 		    updateHyperspaceLanesWithCorrectNode(results, function(errorUpdate) {
// 		    	cb(errorUpdate, results);
// 		    });
// 			});
// 		}
// 	});
// }


async function hyperlaneCorrectionAsync() {
		try {
		const result	= await MongoController.getAllHyperspaceLanes();

		console.log("total hyperspace lanes: ", result.length);

		const badLanes = await Promise.filter(result, function(lane) {
			return validateLaneNodesAsync(lane) === false;
		});

		const hyperspaceUpdate = await updateHyperspaceLanesWithCorrectNodeAsync(badLanes);

		return hyperspaceUpdate;


		// asyncLib.filterLimit(result, 2, validateLaneNodes, function(err, results) {
	 //    console.log("err: ", err);
	 //    updateHyperspaceLanesWithCorrectNode(results, function(errorUpdate) {
	 //    	cb(errorUpdate, results);
	 //    });
		// });

	} catch(err) {
		console.log("error adding coordinates to database: ", err);
	}



	// DatabaseController.getAllHyperspaceLanes(function(error, result) {
	// 	if(error) {
	// 		console.log("error getting all hyperspace lanes: ", error);
	// 		cb(error, null);
	// 	} else {
	// 		console.log("total hyperspace lanes: ", result.length);
	// 		asyncLib.filterLimit(result, 2, validateLaneNodes, function(err, results) {
	// 	    console.log("err: ", err);
	// 	    updateHyperspaceLanesWithCorrectNode(results, function(errorUpdate) {
	// 	    	cb(errorUpdate, results);
	// 	    });
	// 		});
	// 	}
	// });
}


// function validateLaneNodes(hyperspaceLane, cb) {
// 	asyncLib.parallel([
//     function(callback) {
//       DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.start},function(error,resultNode){
// 				if(error) {
// 					callback(error, false);
// 				} else {
// 					callback(null, resultNode.status);
// 				}
// 			});
//     },
//     function(callback) {
//       DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.end},function(error,resultNode){
// 				if(error) {
// 					callback(error, false);
// 				} else {
// 					callback(null, resultNode.status);
// 				}
// 			});
//     }
// 	],
// 	function(err, results) {
//     const startNodeFound = results[0];
//     const endNodeFound = results[1];
//     if(err) {
//     	cb(err, false);
//     } else if(!startNodeFound || !endNodeFound) {
// 	    console.log("bad hyperspace lane node: ", hyperspaceLane);
// 	    console.log("results: ", results);
//     	cb(null, true);
//     } else {
//     	cb(null, false);
//     }
// 	});
// }




async function validateLaneNodesAsync(hyperspaceLane, cb) {
	try {
		const startNodeFound = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.start});
		const endNodeFound = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.end});
 		if(!startNodeFound || !endNodeFound) {
	    console.log("bad hyperspace lane node: ", hyperspaceLane);
	    console.log("startNodeFound: ", startNodeFound);
	    console.log("endNodeFound: ", endNodeFound);
	    return false;
    } else {
    	return true;
    }
	} catch(err) {
		console.log("error validating hyperspace nodes: ", err);
		return false;
	}
}


// function updateHyperspaceLanesWithCorrectNode(lanesToCorrect, cb) {
// 	asyncLib.eachLimit(lanesToCorrect, 2, function(lane, callback) {
// 		findBadNodeOnLane(lane, function(err, result) {
// 			callback(err, result);
// 		});
// 	}, function(err) {
// 	    // if any of the file processing produced an error, err would equal that error
//     if( err ) {
//       // One of the iterations produced an error.
//       // All processing will now stop.
//       console.log('Error updateing hyperspace lanes...');
//     } else {
//       console.log('Hyperspace lanes updating successfully..');
//     }
//     cb(err);
// 	});
// }


function updateHyperspaceLanesWithCorrectNodeAsync(lanesToCorrect) {
  return Promise.map(lanesToCorrect, lane => { 
    return findBadNodeOnLaneAsync(lane);
  }, 
    {
      concurrency: 2
    }
  );
}


// function findBadNodeOnLane(hyperspaceLane, cb) {
// 	asyncLib.parallel([
// 	    function(callback) {
//         DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.start},function(error,resultNode){
// 					if(error) {
// 						callback(error, false);
// 					} else {
// 						callback(null, resultNode.status);
// 					}
// 				});
// 	    },
// 	    function(callback) {
//         DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.end},function(error,resultNode){

// 					if(error) {
// 						callback(error, false);
// 					} else {
// 						callback(null, resultNode.status);
// 					}
// 				});
// 	    }
// 	],
// 	function(err, results) {
// 	    const startNodeFound = results[0];
// 	    const endNodeFound = results[1];

// 	    if(err) {
// 	    	cb(err, hyperspaceLane);
// 	    } else if(!startNodeFound) {
// 		    const laneStartLng = hyperspaceLane.startCoordsLngLat[0];
// 		    const laneStartLat = hyperspaceLane.startCoordsLngLat[1];

// 		    const NodePromise = DatabaseController.findOneHyperspaceNodeAsync({
// 		    	lat: laneStartLat,
// 		    	lng: laneStartLng
// 		    });

// 		    NodePromise.then(function(hyperspaceNode) {
// 		    	console.log("hyperspaceNode Start: ", hyperspaceNode);		    	
// 		    	return DatabaseController.findHyperspaceLaneAndUpdateAsync({
// 		    		hyperspaceHash: hyperspaceLane.hyperspaceHash
// 		    	},{
// 		    		start: hyperspaceNode.doc.system
// 		    	});
// 		    }).then(function(hyperspaceLaneUpdate) {
// 		    	console.log("hyperspaceLane Start: ", hyperspaceLaneUpdate);
// 		    	cb(null, hyperspaceLaneUpdate);
// 		    })
// 		    .error(function(hyperspaceNodeError) {
// 		    	console.log("hyperspaceNodeError Start: ", hyperspaceNodeError);
// 		    	cb(hyperspaceNodeError, null);
// 		    });
// 	    } else if(!endNodeFound) {

// 		    const laneEndLng = hyperspaceLane.endCoordsLngLat[0];
// 		    const laneEndLat = hyperspaceLane.endCoordsLngLat[1];

// 		    const NodePromise = DatabaseController.findOneHyperspaceNodeAsync({
// 		    	lat: laneEndLat,
// 		    	lng: laneEndLng
// 		    });

// 		    NodePromise.then(function(hyperspaceNode) {
// 		    	console.log("hyperspaceNode End: ", hyperspaceNode);
// 		    	return DatabaseController.findHyperspaceLaneAndUpdateAsync({
// 		    		hyperspaceHash: hyperspaceLane.hyperspaceHash
// 		    	},{
// 		    		end: hyperspaceNode.doc.system
// 		    	});
// 		    }).then(function(hyperspaceLaneUpdate) {
// 		    	console.log("hyperspaceLane End: ", hyperspaceLaneUpdate);
// 		    	cb(null, hyperspaceLaneUpdate);
// 		    }).error(function(hyperspaceNodeError) {
// 		    	console.log("hyperspaceNodeError End: ", hyperspaceNodeError);
// 		    	cb(hyperspaceNodeError, null);
// 		    });
// 	    } else {
// 	    	cb(null, hyperspaceLane);
// 	    }

// 	});
// }


async function findBadNodeOnLaneAsync(hyperspaceLane, cb) {
	try {
		const StartNode = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.start});
		const EndNode = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.end});

		console.log("StartNode: ", StartNode);
		console.log("EndNode: ", EndNode);
		
		if(!StartNode) {

	    const laneStartLng = hyperspaceLane.startCoordsLngLat[0];
	    const laneStartLat = hyperspaceLane.startCoordsLngLat[1];

	    const hyperspaceNode = await MongoController.findOneHyperspaceNodeAsync({
	    	lat: laneStartLat,
	    	lng: laneStartLng
	    });

    	const hyperspaceLaneUpdate = await MongoController.findHyperspaceLaneAndUpdateAsync({
    		hyperspaceHash: hyperspaceLane.hyperspaceHash
    	},{
    		start: hyperspaceNode.doc.system
    	});

    }

    if(!EndNode) {

	    const laneEndLng = hyperspaceLane.endCoordsLngLat[0];
	    const laneEndLat = hyperspaceLane.endCoordsLngLat[1];

	    const hyperspaceNode = await MongoController.findOneHyperspaceNodeAsync({
	    	lat: laneEndLat,
	    	lng: laneEndLng
	    });

    	const hyperspaceLaneUpdate = await MongoController.findHyperspaceLaneAndUpdateAsync({
    		hyperspaceHash: hyperspaceLane.hyperspaceHash
    	},{
    		end: hyperspaceNode.doc.system
    	});

    }

    if(StartNode && EndNode) {
    	return hyperspaceLane;
    } else {
    	return 
    }

	} catch(err) {
		console.log("error finding bad node in database: ", err);
		return hyperspaceLane;
	}

}




// function getCoordinatesFromCSV() {
// 	const stream = fs.createReadStream("./data/planets.csv");
// 	const csvStream = csv()
//     .on("data", function(data){
// 			const zoom = parseInt(data[2]);
// 			console.log("zoom: ", zoom);
// 			const systemName = data[11];
// 			const y = data[14];
// 			const x = data[15];
// 			const UpdateItem = {
// 				xGalactic: x,
// 				yGalactic: y,
// 				hasLocation: true,
// 				zoom: zoom
// 			};
// 			// DatabaseController.findPlanetAndUpdate({system: systemName}, UpdateItem);

// 			MongoController.findPlanetAndUpdate({system: systemName}, UpdateItem).then(planetUpdate => {
// 				// console.log("planetUpdate: ", planetUpdate);
// 			}).catch(errorPlanetUpdate => {
// 				console.log("errorPlanetUpdate: ", errorPlanetUpdate);
// 			});
//     })
//     .on("end", function(){
// 			console.log("done reading planets.csv");
//     });
// 	stream.pipe(csvStream);
// }

function getGalacticYFromLatitude(latitude) {
  return  (-3.07e-19*(latitude**12)) + (-1.823e-18*(latitude**11)) + (4.871543e-15*(latitude**10)) + (4.1565807e-14*(latitude**9)) + (-2.900986202e-11 * (latitude**8)) + (-1.40444283864e-10*(latitude**7)) + (7.9614373223054e-8*(latitude**6)) + (7.32976568692443e-7*(latitude**5)) + (-0.00009825374539548058*(latitude**4)) + (0.005511093818675318*(latitude**3)) + (0.04346753629461727 * (latitude**2)) + (111.30155374684914 * latitude);
}

function getGalacticXFromLongitude(longitude) {
  return (111.3194866138503 * longitude);
}

function genRandFiveDigit() {
  return Math.floor(Math.random()*89999+10000);
}




loadDatabase();

