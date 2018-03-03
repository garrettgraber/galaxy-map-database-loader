const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
	lr = new LineByLineReader('./data/StarWarsText2.txt'),
	asyncLib = require('async'),
	uuidv4 = require('uuid/v4'),
	Promise = require("bluebird");

const DatabaseLinks = require('docker-links').parseLinks(process.env);

const Planet = require('./data-classes/classes.js').Planet;
const HyperSpaceLane = require('./data-classes/classes.js').HyperSpaceLane;
const HyperSpaceNode = require('./data-classes/classes.js').HyperSpaceNode;
const NodeDataBuilder = require('./data-classes/classes.js').NodeDataBuilder;
const Point = require('./data-classes/classes.js').Point;
const Alphabets = require('./data-classes/alphabets.js');

const writeToDatabaseGlobal = true;
let systemsNotInAppendix = 0;
let totalPlanetNodesCreated = 0;
let totalEmptySpaceNodesCreated = 0;

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
				MongoController.createSector(currentSector).then(SectorData => {
				}).catch(SectorError => {
					console.log("SectorError: ", SectorError);
				});
	    }
		},
	}
};

const loadDatabase = () => {
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
					loadHyperspaceLanesAsync().then(hyperspaceLaneResults => {
						console.log("Hyperspace lane results: ", hyperspaceLaneResults.length);
						getDatabaseStatsAsync().then(() => {
							console.log("database stats displayed");
							process.exit(1);
						}).catch(errorStats => {
							console.log("error displaying database stats: ", errorStats);
						});
					}).catch(hyperspaceLaneError => {
						console.log("Error loading hyperspace lanes: ", hyperspaceLaneError);
					});
				}).catch(error => {
					console.log("error: ", error);
				});
			}
		});
	}).catch(errorConnect => {
		console.log("error connecting to the mongo database: ", errorConnect);
	});
};

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
		console.log("Total Planets that are Nodes: ", totalPlanetNodesCreated);
		console.log("Total Empty Space Nodes: ", totalEmptySpaceNodesCreated);
		console.log("Total Nodes Created: ", totalPlanetNodesCreated + totalEmptySpaceNodesCreated);
	} catch(err) {
		throw new Error(err);
	}
};

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

async function findOrCreateNode(CurrentPoint, hyperspaceLaneName) {
	try {
		const resultNode = await MongoController.findOneHyperspaceNodeAsync(CurrentPoint.locationObject());
		if(resultNode !== null) {
			let nodeHyperspaceLanes = resultNode.hyperspaceLanes;
			nodeHyperspaceLanes.push(hyperspaceLaneName);
			return await MongoController.findHyperspaceNodeAndUpdate({system: resultNode.system}, {hyperspaceLanes: nodeHyperspaceLanes});
		} else {
			const resultPlanet = await MongoController.findOnePlanet(CurrentPoint.locationObject());	
			const planetFound = resultPlanet.doc && resultPlanet.status;
			if(planetFound) {
				var NodeData = new NodeDataBuilder();
				NodeData.createPlanetNode(resultPlanet.doc, hyperspaceLaneName, Alphabets);
				totalPlanetNodesCreated++;	
			} else {
				var NodeData = new NodeDataBuilder();
				NodeData.createEmptySpaceNode(CurrentPoint, hyperspaceLaneName, Alphabets);
				totalEmptySpaceNodesCreated++;
			}
			return await MongoController.createHyperspaceNodeAsync(NodeData.nodeDataObject());
		}
	} catch(err) {
		throw new Error(err);
	}
};

async function buildLaneAsync(hyperspaceLane) {
	try {
		const hyperspaceLaneProps = hyperspaceLane.properties;
		let hyperspaceLaneName = hyperspaceLaneProps.hyperspace;
		if(hyperspaceLaneName === null || hyperspaceLaneName === undefined) {
			hyperspaceLaneName = Alphabets.findLaneName();
		}
		const hyperspaceCoordinates = _.flattenDepth(hyperspaceLane.geometry.coordinates, 1);
		const startCoordinates = hyperspaceCoordinates[0];
		const endCoordintes = hyperspaceCoordinates[ hyperspaceCoordinates.length - 1 ];
		const StartPoint = new Point(startCoordinates);
		const EndPoint = new Point(endCoordintes);
		const StartResult = await findOrCreateNode(StartPoint, hyperspaceLaneName);
		const EndResult = await findOrCreateNode(EndPoint, hyperspaceLaneName);
		const hyperspaceHash = uuidv4();
		const SpaceLane = new HyperSpaceLane(
			hyperspaceLaneName,  // name
			hyperspaceHash, // hyperspaceHash
			StartResult.system, // start
			EndResult.system, // end
			StartPoint.coordinates, // startCoordinates
			EndPoint.coordinates, // endCoordintes
			hyperspaceLaneProps.length, // length
			hyperspaceLaneProps.link, // link
			null, // Default Start Node, Comes from Graph Database
			null, // Default End Node, Comes from Graph Database
			hyperspaceCoordinates
		);
		const CreateHyperspaceLaneResult = await MongoController.createHyperspaceLane(SpaceLane);
		return CreateHyperspaceLaneResult;

	} catch (err) {
		throw new Error(err);
	}
};

async function loadHyperspaceLanesAsync() {
	try {
		console.log("loading hyperspace lanes...");
		const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));
	  return await Promise.map(HyperspaceLanes.features, lane => { 
	    return buildLaneAsync(lane);
	  }, 
	    {
	      concurrency: 1
	    }
	  );
	} catch(err) {
		throw new Error(err);
	}
};

async function hyperlaneCorrectionAsync() {
	try {
		const result	= await MongoController.getAllHyperspaceLanes();
		// console.log("total hyperspace lanes: ", result.length);
		const badLanes = await Promise.filter(result, function(lane) {
			return validateLaneNodesAsync(lane) === false;
		});

		console.log("Bad Lanes: ", badLanes);
		return false;

		// const hyperspaceUpdate = await updateHyperspaceLanesWithCorrectNodeAsync(badLanes);
		// return hyperspaceUpdate;
		// asyncLib.filterLimit(result, 2, validateLaneNodes, function(err, results) {
	 //    console.log("err: ", err);
	 //    updateHyperspaceLanesWithCorrectNode(results, function(errorUpdate) {
	 //    	cb(errorUpdate, results);
	 //    });
		// });

	} catch(err) {
		console.log("error adding coordinates to database: ", err);
	}
}

async function validateLaneNodesAsync(hyperspaceLane, cb) {
	try {
		const startNodeFound = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.start});
		const endNodeFound = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.end});
 		if(!startNodeFound || !endNodeFound) {
	    console.log("\nbad hyperspace lane node: ", hyperspaceLane);
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

function updateHyperspaceLanesWithCorrectNodeAsync(lanesToCorrect) {
  return Promise.map(lanesToCorrect, lane => { 
    return findBadNodeOnLaneAsync(lane);
  }, 
    {
      concurrency: 2
    }
  );
}

async function findBadNodeOnLaneAsync(hyperspaceLane, cb) {
	try {
		const StartNode = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.start});
		const EndNode = await MongoController.findOneHyperspaceNodeAsync({system:hyperspaceLane.end});
		if(!StartNode) {
			console.log("StartNode: ", StartNode);
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
			console.log("EndNode: ", EndNode);
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
    	return {};
    }
	} catch(err) {
		console.log("error finding bad node in database: ", err);
		return hyperspaceLane;
	}
}

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