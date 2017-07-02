const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
    lr = new LineByLineReader('./data/StarWarsText2.txt'),
    async = require('async'),
    uuidv1 = require('uuid/v1'),
    uuidv4 = require('uuid/v4');

const Planet = require('./data-classes/classes.js').Planet;
const HyperSpaceLane = require('./data-classes/classes.js').HyperSpaceLane;
const Alphabets = require('./data-classes/alphabets.js');

const writeToDatabaseGlobal = true;
const DatabaseLinks = require('docker-links').parseLinks(process.env);
console.log("DatabaseLinks: ", DatabaseLinks);
let DatabaseController;
let systemsNotInAppendix = 0;

if(DatabaseLinks.hasOwnProperty('mongo')) {
	console.log("Using mongo...");
	DatabaseController = require('./controllers/mongo-controller.js');
} else if(DatabaseLinks.hasOwnProperty('dynamodb')) {
	console.log("Using dynamo...");
	DatabaseController = require('./controllers/dynamo-controller.js');
} else {
	console.log("No database selected. Exiting!");
	process.exit(1);
}

console.log("DatabaseController: ", DatabaseController);

const LineReader = (writeToDatabase) => {
	return {
		lineCount: 0,
		masterPlanetArray : [],
		nonPlanetFound: 0,

		readLine(line) {

			this.lineCount++;
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
	const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));
	let totalHyperspaceLanes = 0;
	let totalPlanetToPlanetLanes = 0;
	let totalPlanetToEmptyLanes = 0;
	let totalEmptyToEmptyLanes = 0;

	async.eachSeries(HyperspaceLanes.features, function(hyperspaceLane, callbackEach) {
		let hyperspaceLaneProps = hyperspaceLane.properties;
		let hyperspaceCoordinates = hyperspaceLane.geometry.coordinates[0];
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
					callback(err, res);
				});
			}, function(callback) {
				DatabaseController.findOnePlanet({LngLat: endCoordintes}, function(err2, res2) {
					callback(err2, res2);
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
	 		}
	 		if(systemB === null) {
				systemB = Alphabets.findNodeName();
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

			const systemACoordinates = [Start.lng, Start.lat];
			const systemBCoordinates = [End.lng, End.lat];

			async.parallel([
			    function(callbackNode) {
			        DatabaseController.createHyperspaceNode({
						system: systemA,
						lat: systemALat,
						lng: systemALng,
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace]
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
						hyperspaceLanes: [hyperspaceLaneProps.hyperspace]
					}, function(errorNode, resultNode) {
						if(errorNode) {
							console.log("Node creation error: ", errorNode);
							callbackNode(errorNode);
						} else {
							callbackNode(null, resultNode);
						}
					});
			    }
			],
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
			    	console.log("hyperspaceHash: ", hyperspaceHash);
			    	const hyperspaceNameDesignation = hyperspaceHash;
			    	const TempHyperSpaceLane = new HyperSpaceLane(
						hyperspaceLaneProps.hyperspace,
						hyperspaceNameDesignation,
						startSystem,
						endSystem,
						startCoordinates,
						endCoordintes,
						hyperspaceLaneProps.length,
						hyperspaceLaneProps.link,
						Start,
						End
					);
					// console.log("TempHyperSpaceLane: ", TempHyperSpaceLane);
					totalHyperspaceLanes += 1;

			    	DatabaseController.createHyperspaceLane(TempHyperSpaceLane, function(errorCreate, resultCreate) {
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
		console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
		console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);
		console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
		console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);
		console.log("Planets not in the Appendix: ", systemsNotInAppendix);
		getDatabaseStats();
		cb(errorEach);
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