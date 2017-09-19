const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
	lr = new LineByLineReader('./data/StarWarsText2.txt'),
	async = require('async'),
	uuidv1 = require('uuid/v1'),
	uuidv4 = require('uuid/v4'),
	Promise = require("bluebird");

const Planet = require('./data-classes/classes.js').Planet;
const HyperSpaceLane = require('./data-classes/classes.js').HyperSpaceLane;
const HyperSpaceNode = require('./data-classes/classes.js').HyperSpaceNode;
const Alphabets = require('./data-classes/alphabets.js');

const writeToDatabaseGlobal = true;
const DatabaseLinks = require('docker-links').parseLinks(process.env);
console.log("DatabaseLinks: ", DatabaseLinks);
let DatabaseController;
let systemsNotInAppendix = 0;

if(DatabaseLinks.hasOwnProperty('mongo')) {
	console.log("Using mongo...");
	DatabaseController = require('./controllers/mongo-controller.js');
	Promise.promisifyAll(DatabaseController);
} else if(DatabaseLinks.hasOwnProperty('dynamodb')) {
	console.log("Using dynamo...");
	DatabaseController = require('./controllers/dynamo-controller.js');
} else {
	console.log("No database selected. Exiting!");
	process.exit(1);
}


const LineReader = (writeToDatabase) => {
	return {
		lineCount: 0,
		masterPlanetArray : [],
		nonPlanetFound: 0,

		readLine(line) {

			this.lineCount++;
			console.log("current line: ", this.lineCount);
			var systemValue = line.slice(0, 44).trim().replace(/\\/g, '');
			// console.log("systemValue: ", systemValue);
			var sectorValue = line.slice(44, 67).trim().replace(/\(/g,'/').replace(/\)/g,'').split('/');
			// console.log( (!(sectorValue  instanceof Array))? "Sector is not an array: " + sectorValue : 'Sector is array!');
			var regionValue = line.slice(67, line.length - 11).trim();
			// console.log("regionValue: ", regionValue);
			var coordinatesValue = line.slice(line.length - 11, line.length).trim();
			// console.log("coordinatesValue: ", coordinatesValue);
			var notAPlanet = (
				line.search('Lucasfilm') > -1 ||
				line.search('SYSTEM') > -1 ||
				line.length <= 1 ||
				coordinatesValue === "" ||
				coordinatesValue === "Appendix"
			);
			// if(line.search('Lucasfilm') > -1 || line.search('SYSTEM') > -1 || line.length <= 1 || coordinatesValue === "" || coordinatesValue === "Appendix") {
			// 	this.nonPlanetFound++;

			if(notAPlanet) {
				this.nonPlanetFound++;
			} else {

				var TempPlanet = new Planet(systemValue, sectorValue, regionValue, coordinatesValue);
				this.masterPlanetArray.push(TempPlanet);

				if(writeToDatabase) {
					DatabaseController.createPlanet(TempPlanet);
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
					// console.log("Good coordinate letter");
					coordinateSetLetter.add(currentCoordinateLetter);
				} else {
					// console.log("bad coordinate number");
				}

				// coordinateSetLetter.add(currentCoordinateLetter);
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
				// console.log(coordinateTempValue);
				if(writeToDatabase) {
					DatabaseController.createCoordinate(coordinateTempValue);
				}
			}
	    console.log("Number of coordinates: ", coordinateSet.size);
	    // console.log("coordinateSetLetter: ", coordinateSetLetter);
	    // console.log("coordinateSetNumber: ", coordinateSetNumber);
	    // console.log("region set: ", regionSet);
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
				DatabaseController.createSector(currentSector);
	    }
		},
	}
};


DatabaseController.connectToDatabase(function(errorConnect, resultConnect) {

	console.log("Starting database loading: ", resultConnect);
	console.log("Error connecting to database: ", errorConnect);
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
		DatabaseController.totalPlanets();
		DatabaseController.totalCoordinates();

		if(writeToDatabaseGlobal) {
			getCoordinatesFromGeoJson(function(error) {
				if(error) {
					console.log("error: ", error);
				} else {
					console.log("No error loading planet data!");
					loadHyperspaceLanes(function(errorHyperspace) {});
				}
			});
		}
	});
});


function getDatabaseStats() {
	DatabaseController.totalPlanets();
	DatabaseController.totalCoordinates();
	DatabaseController.totalPlanetsHasLocation();
	DatabaseController.totalSectors();
	DatabaseController.totalHyperspaceNodes();
	DatabaseController.totalHyperspaceLanes();
}

function getCoordinatesFromGeoJson(callback) {
	console.log("getCoordinatesFromGeoJson has fired!");
	const Planets = JSON.parse(fs.readFileSync('./data/planets.geojson', 'utf8'));

	async.eachLimit(Planets.features, 5, loadPlanet, function(err){
		console.log("async each done!");
		if(err) {
			console.log("Error loading planet data: ", err);
			callback(err);
		} else {
			console.log("Planet data loaded! Total planets in planets.geojson: ", Planets.features.length);
			callback(null);
		}
	});
}

function loadPlanet(planet, cb) {
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

	console.log("FocusedPlanet: ", FocusedPlanet);

	DatabaseController.findPlanetAndUpdate({system: system}, FocusedPlanet, function(err, doc){
		if(err) {
			console.log("err: ", err);
			cb(err, {});
		} else if(doc === null) {
			cb(null, false);

			DatabaseController.createPlanet(FocusedPlanet);
			systemsNotInAppendix++;
		} else {
			cb(null, true);
		}
	});
}

function loadHyperspaceLanes(cb) {

	console.log("loading hyperspace lanes...");
	const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));
	let totalHyperspaceLanes = 0;
	let totalPlanetToPlanetLanes = 0;
	let totalPlanetToEmptyLanes = 0;
	let totalEmptyToEmptyLanes = 0;

	async.eachSeries(HyperspaceLanes.features, function(hyperspaceLane, callbackEach) {
		let hyperspaceLaneProps = hyperspaceLane.properties;
		// let hyperspaceCoordinates = hyperspaceLane.geometry.coordinates[0];
		let hyperspaceCoordinates = _.flattenDepth(hyperspaceLane.geometry.coordinates, 1);
		// _.forEach(hyperspaceCoordinates, function(el) {
		//   el.reverse();
		// });
		// hyperspaceCoordinates = _.map(hyperspaceCoordinates, function(el) {
		// 	return el.reverse();
		// });
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

		async.parallel([
			function(callback) {
				DatabaseController.findOnePlanet({LngLat: startCoordinates}, function(err, res) {
					// (res.doc)? console.log("res found doc: ", res) : console.log("res did not find doc: ", res);
					if(err) {
						callback(err, null);
					} else if(res.doc && res.status) {
						// console.log("Found planet: ", res.doc.system);
						callback(null, res);
					} else {
						DatabaseController.findOneHyperspaceNode({lat: Start.lat, lng: Start.lng}, function(errorNode, resultNode) {
							if(errorNode) {
								console.log("errorNode: ", errorNode);
								callback(errorNode, null);
							} else {
								// console.log("resultNode: ", resultNode);
								callback(null, resultNode);
							}
						});
					}
				});
			}, function(callback) {
				DatabaseController.findOnePlanet({LngLat: endCoordintes}, function(err2, res2) {
					// (res2.doc)? console.log("res2 found doc: ", res2) : console.log("res2 did not find doc: ", res2);
					if(err2) {
						callback(err2, null);
					} else if(res2.doc && res2.status) {
						// console.log("Found planet: ", res2.doc.system);
						callback(null, res2);
					} else {
						DatabaseController.findOneHyperspaceNode({lat: End.lat, lng: End.lng}, function(errorNode, resultNode) {
							if(errorNode) {
								console.log("errorNode: ", errorNode);
								callback(errorNode, null);
							} else {
								// console.log("resultNode2: ", resultNode);
								callback(null, resultNode);
							}
						});
					}
				});
			}
		], function(error, results) {
			if(error) {
				callbackEach(error);
			}
			const firstResult = results[0];
			const secondResult = results[1];
			let systemA = (firstResult.status)? firstResult.doc.system : null;
			let systemB = (secondResult.status)? secondResult.doc.system : null;
			const systemALat = (firstResult.doc)? firstResult.doc.lat : Start.lat;
			const systemALng = (firstResult.doc)? firstResult.doc.lng : Start.lng;
			const systemBLat = (secondResult.doc)? secondResult.doc.lat : End.lat;
			const systemBLng = (secondResult.doc)? secondResult.doc.lng : End.lng;

			if(hyperspaceLaneProps.hyperspace === null) {
				hyperspaceLaneProps.hyperspace = Alphabets.findLaneName();
			}
			if(systemA === null) {
				systemA = Alphabets.findNodeName();
				// console.log("Creating hyperspace node A: ", systemA);
	 		}
	 		if(systemB === null) {
				systemB = Alphabets.findNodeName();
				// console.log("Creating hyperspace node B: ", systemB);
	 		}
			// console.log("\nHyperspace Node A: ", systemA);
			// console.log("systemALat: ", systemALat);
			// console.log("systemALng: ", systemALng);
			// console.log("Hyperspace Node B: ", systemB);
			// console.log("systemBLat: ", systemBLat);
			// console.log("systemBLng: ", systemBLng);
			// console.log("\n");
			if((firstResult.status) && (secondResult.status)) {
				totalPlanetToPlanetLanes += 1;
			} else if(firstResult.status || secondResult.status) {
				totalPlanetToEmptyLanes += 1;
			} else {
				totalEmptyToEmptyLanes += 1;
			}

			// const systemACoordinates = [Start.lng, Start.lat];
			// const systemBCoordinates = [End.lng, End.lat];
			// const HyperspaceNodeStart = new HyperSpaceNode(
			// 	systemA,
			// 	systemALat,
			// 	systemALng,
			// 	[hyperspaceLaneProps.hyperspace],
			// 	0
			// );

			async.parallel([
		    function(callbackNode) {
	        	DatabaseController.createHyperspaceNode({
						system: systemA,
						lat: systemALat,
						lng: systemALng,
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
						nodeId: 0,
						loc: [systemALng, systemALat]
				}, function(errorNode, resultNode) {
					if(errorNode) {
						console.log("Node creation error: ", errorNode);
						callbackNode(errorNode, resultNode);
					} else {
						callbackNode(null, resultNode);
					}	
				});
		    },
		    function(callbackNode) {
		    	DatabaseController.createHyperspaceNode({
						system: systemB,
						lat: systemBLat,
						lng: systemBLng,
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace],
						nodeId: 0,
						loc: [systemBLng, systemBLat]
					}, function(errorNode, resultNode) {
						if(errorNode) {
							console.log("Node creation error: ", errorNode);
							callbackNode(errorNode);
						} else {
							callbackNode(null, resultNode);
						}
					});
		    }],
			function(errorCreate, resultsCreate) {
		    if(errorCreate) {
		    	callbackEach(errorCreate);
		    } else {
		    	// console.log("resultsCreate: ", resultsCreate);
		    	let startSystem = resultsCreate[0];
		    	let endSystem = resultsCreate[1];

		    	if(startSystem) {
		    		console.log("startSystem: ", startSystem);
		    		Alphabets.backOneNodeName();
		    	}
		    	if(endSystem) {
		    		console.log("endSystem: ", endSystem);
		    		Alphabets.backOneNodeName();
		    	}

		    	startSystem = (startSystem)? startSystem : systemA;
		    	endSystem = (endSystem)? endSystem : systemB;
		    	const hyperspaceHash = uuidv4();
		    	// console.log("hyperspaceHash: ", hyperspaceHash);
		    	// console.log("hyperspaceHash type: ", typeof hyperspaceHash);
		    	const SpaceLane = new HyperSpaceLane(
					hyperspaceLaneProps.hyperspace,  // name
					hyperspaceHash, // hyperspaceHash
					startSystem, // start
					endSystem, // end
					startCoordinates, // startCoordinates
					endCoordintes, // endCoordintes
					hyperspaceLaneProps.length, // length
					hyperspaceLaneProps.link, // link
					null, // Start Node
					null, // End Node
					hyperspaceCoordinates
				);
				// console.log("SpaceLane: ", SpaceLane);
				totalHyperspaceLanes += 1;

		    	DatabaseController.createHyperspaceLane(SpaceLane, function(errorCreate, resultCreate) {
						if(errorCreate) {
							callbackEach(errorCreate);
						} else {
							callbackEach(null);
						}
					});
		    	}
			});
		});
	}, function(errorEach) {
		if(errorEach) {
			console.log("Error setting up hyperspace lanes: ", errorEach);
		}
		// console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
		// console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);
		// console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
		// console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);
		// console.log("Planets not in the Appendix: ", systemsNotInAppendix);

		// getDatabaseStats();
		// cb(errorEach);
		

		hyperlaneCorrection(function(laneCorrectionError, laneCorrectionResult) {
			console.log("laneCorrectionError: ", laneCorrectionError);
			console.log("laneCorrectionResult: ", laneCorrectionResult);
			console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
			console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);
			console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
			console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);
			console.log("Planets not in the Appendix: ", systemsNotInAppendix);
			getDatabaseStats();
			console.log("DatabaseController: ", DatabaseController);
			cb(errorEach);
		});

	});
}


function hyperlaneCorrection(cb) {

	DatabaseController.getAllHyperspaceLanes(function(error, result) {

		if(error) {
			console.log("error getting all hyperspace lanes: ", error);
			cb(error, null);
		} else {
			console.log("total hyperspace lanes: ", result.length);

			// for(let lane of result) {






			// }


			// async.eachSeries(mapSeries, function(hyperspaceLane, callbackEach) {})


			// async.mapSeries(result, function(hyperspaceLane, callbackEach){
			//     return callbackEach(null, hyperspaceLane);
			// }, function(err, results) {
			//     console.log('results : ' + results);  // results : name1,name2,name3
			//     cb(null, results);

			// });


			// async.filterLimit(result, 2, function(hyperspaceLane, callbackEach){
			// 		if(hyperspaceLane.start)
			//   	return callbackEach(null, hyperspaceLane);
			// }, function(err, results) {
			//   	console.log('results : ' + results);  // results : name1,name2,name3
			// });

			async.filterLimit(result, 2, validateLaneNodes, function(err, results) {
			    // results now equals an array of the existing files
			    console.log("err: ", err);
			    // console.log("hyperspace lanes with incorrect node names results: ", results);
			    // cb(err, results);

			    updateHyperspaceLanesWithCorrectNode(results, function(errorUpdate) {
			    	cb(errorUpdate, results);
			    });

			});

		}

	});

}


function validateLaneNodes(hyperspaceLane, cb) {

	async.parallel([
	    function(callback) {
	        DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.start},function(error,resultNode){
				if(error) {
					callback(error, false);
				} else {
					callback(null, resultNode.status);
				}
			});
	    },
	    function(callback) {
	        DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.end},function(error,resultNode){

				if(error) {
					callback(error, false);
				} else {
					callback(null, resultNode.status);
				}
			});
	    }
	],
	// optional callback
	function(err, results) {
	    // the results array will equal ['one','two'] even though
	    // the second function had a shorter timeout.

	    const startNodeFound = results[0];
	    const endNodeFound = results[1];

	    if(err) {
	    	cb(err, false);
	    } else if(!startNodeFound || !endNodeFound) {
		    console.log("bad hyperspace lane node: ", hyperspaceLane);
		    console.log("results: ", results);
	    	cb(null, true);
	    } else {
	    	cb(null, false);
	    }

	});
}


function updateHyperspaceLanesWithCorrectNode(lanesToCorrect, cb) {

	async.eachLimit(lanesToCorrect, 2, function(lane, callback) {
		findBadNodeOnLane(lane, function(err, result) {
			callback(err, result);
		});
	}, function(err) {
	    // if any of the file processing produced an error, err would equal that error
	    if( err ) {
	      // One of the iterations produced an error.
	      // All processing will now stop.
	      console.log('Error updateing hyperspace lanes...');
	    } else {
	      console.log('Hyperspace lanes updating successfully..');
	    }
	    cb(err);
	});

}



function findBadNodeOnLane(hyperspaceLane, cb) {

	async.parallel([
	    function(callback) {
	        DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.start},function(error,resultNode){
				if(error) {
					callback(error, false);
				} else {
					callback(null, resultNode.status);
				}
			});
	    },
	    function(callback) {
	        DatabaseController.findOneHyperspaceNode({system:hyperspaceLane.end},function(error,resultNode){

				if(error) {
					callback(error, false);
				} else {
					callback(null, resultNode.status);
				}
			});
	    }
	],
	// optional callback
	function(err, results) {
	    // the results array will equal ['one','two'] even though
	    // the second function had a shorter timeout.

	    const startNodeFound = results[0];
	    const endNodeFound = results[1];

	    if(err) {
	    	cb(err, hyperspaceLane);
	    } else if(!startNodeFound) {
		    // console.log("bad hyperspace lane start node: ", hyperspaceLane);
		    // console.log("results: ", results);

		    const laneStartLng = hyperspaceLane.startCoordsLngLat[0];
		    const laneStartLat = hyperspaceLane.startCoordsLngLat[1];

		    const NodePromise = DatabaseController.findOneHyperspaceNodeAsync({
		    	lat: laneStartLat,
		    	lng: laneStartLng
		    });

		    NodePromise.then(function(hyperspaceNode) {
		    	console.log("hyperspaceNode Start: ", hyperspaceNode);		    	
		    	return DatabaseController.findHyperspaceLaneAndUpdateAsync({
		    		hyperspaceHash: hyperspaceLane.hyperspaceHash
		    	},{
		    		start: hyperspaceNode.doc.system
		    	});
		    }).then(function(hyperspaceLaneUpdate) {
		    	console.log("hyperspaceLane Start: ", hyperspaceLaneUpdate);
		    	cb(null, hyperspaceLaneUpdate);
		    })
		    .error(function(hyperspaceNodeError) {
		    	console.log("hyperspaceNodeError Start: ", hyperspaceNodeError);
		    	cb(hyperspaceNodeError, null);
		    });

		    // DatabaseController.findOneHyperspaceNode({lat: laneStartLat, lng: laneStartLng}, function(errorActualNode, resultActualNode) {
		    // 	console.log("resultActualNode: ", resultActualNode);
		    // 	cb(null, hyperspaceLane);
		    // });
		    // cb(null, hyperspaceLane);
	    } else if(!endNodeFound) {
	    	// console.log("bad hyperspace lane end node: ", hyperspaceLane);
		    // console.log("results: ", results);

		    const laneEndLng = hyperspaceLane.endCoordsLngLat[0];
		    const laneEndLat = hyperspaceLane.endCoordsLngLat[1];


		    const NodePromise = DatabaseController.findOneHyperspaceNodeAsync({
		    	lat: laneEndLat,
		    	lng: laneEndLng
		    });

		    NodePromise.then(function(hyperspaceNode) {
		    	console.log("hyperspaceNode End: ", hyperspaceNode);
		    	return DatabaseController.findHyperspaceLaneAndUpdateAsync({
		    		hyperspaceHash: hyperspaceLane.hyperspaceHash
		    	},{
		    		end: hyperspaceNode.doc.system
		    	});
		    }).then(function(hyperspaceLaneUpdate) {
		    	console.log("hyperspaceLane End: ", hyperspaceLaneUpdate);
		    	cb(null, hyperspaceLaneUpdate);
		    }).error(function(hyperspaceNodeError) {
		    	console.log("hyperspaceNodeError End: ", hyperspaceNodeError);
		    	cb(hyperspaceNodeError, null);
		    });


		    // DatabaseController.findOneHyperspaceNode({lat: laneEndLat, lng: laneEndLng}, function(errorActualNode, resultActualNode) {
		    // 	console.log("resultActualNode: ", resultActualNode);
		    // 	cb(null, hyperspaceLane);
		    // });
		    // cb(null, hyperspaceLane);
	    } else {
	    	cb(null, hyperspaceLane);
	    }

	});
}





function updateHyperspaceLane(lane, UpdateItem, cb) {

	DatabaseController.findHyperspaceLaneAndUpdate({hyperspaceHash: lane.hyperspaceHash}, UpdateItem, function(error, result) {

		cb(error, result);

	});
}

function getDatabaseSize(db) {
	const collectionsArray = db.getCollectionNames();
	console.log("collectionsArray: ", collectionsArray);
	// db.foo.stats(1024 * 1024);
}

function getCoordinatesFromCSV() {
	const stream = fs.createReadStream("./data/planets.csv");
	const csvStream = csv()
    .on("data", function(data){
		const zoom = parseInt(data[2]);
		console.log("zoom: ", zoom);
		const systemName = data[11];
		const y = data[14];
		const x = data[15];
		const UpdateItem = {
			xGalactic: x,
			yGalactic: y,
			hasLocation: true,
			zoom: zoom
		};
		// PlanetModel.findOneAndUpdate({system: systemName}, UpdateItem, function(err, doc){
		// 	if(err) {
		// 		console.log("err: ", err);
		// 	} else {
		// 		console.log("System has added coordinates: ", doc);
		// 	}
		// });
		DatabaseController.findPlanetAndUpdate({system: systemName}, UpdateItem);
    })
    .on("end", function(){
         console.log("done reading planets.csv");
    });
	stream.pipe(csvStream);
}