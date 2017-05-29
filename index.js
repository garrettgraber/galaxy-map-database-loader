
const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
    lr = new LineByLineReader('./data/StarWarsText2.txt'),
    async = require('async');


const Planet = require('./data-classes/classes.js').Planet;
const HyperSpaceLane = require('./data-classes/classes.js').HyperSpaceLane;

const writeToDatabaseGlobal = true;

const DatabaseLinks = require('docker-links').parseLinks(process.env);

console.log("DatabaseLinks: ", DatabaseLinks);


let DatabaseController;


if(DatabaseLinks.hasOwnProperty('mongo')) {

	DatabaseController = require('./controllers/mongo-controller.js');

} else if(DatabaseLinks.hasOwnProperty('dynamodb')) {

	DatabaseController = require('./controllers/dynamo-controller.js');

} else {

	console.log("No database selected. Exiting!");
	process.exit(1);

}


console.log("DatabaseController: ", DatabaseController);


const LineReader = (PlantesDatabase, writeToDatabase) => {

	return {

		lineCount: 0,
		masterPlanetArray : [],
		nonPlanetFound: 0,

		readLine(line) {

			if(this.lineCount === 2) {
				// console.log("PlantesDatabase: ", PlantesDatabase);
			}

			this.lineCount++;

			var systemValue = line.slice(0, 44).trim().replace(/\\/g, '');
			// console.log("systemValue: ", systemValue);

			var sectorValue = line.slice(44, 67).trim().replace(/\(/g,'/').replace(/\)/g,'').split('/');

			// console.log( (!(sectorValue  instanceof Array))? "Sector is not an array: " + sectorValue : 'Sector is array!');

			var regionValue = line.slice(67, line.length - 11).trim();
			// console.log("regionValue: ", regionValue);

			var coordinatesValue = line.slice(line.length - 11, line.length).trim();
			// console.log("coordinatesValue: ", coordinatesValue);

			if(line.search('Lucasfilm') > -1 || line.search('SYSTEM') > -1 || line.length <= 1 || coordinatesValue === "" || coordinatesValue === "Appendix") {

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
		    // console.log("resultsSector: ", resultsSector.length);
		    console.log('resultsCoordiantes: ', resultsCoordiantes.length);
		    console.log("resultsSystem: ", resultsSystem);
		    // console.log("resultsSystem.system: ", resultsSystem[0]);

		    console.log("systemFoundIndex: ", systemFoundIndex);
		    console.log("regionFoundIndex: ", regionFoundIndex);
		    // console.log("planets: ", planets);

		    for(let currentSector of sectorSet) {

				DatabaseController.createSector(currentSector);

		    }

		},


	}
};





DatabaseController.connectToDatabase(function(err, res) {

	const LineReaderMasterObject = LineReader(res, writeToDatabaseGlobal);

	lr.on('error', function (err) {
		// 'err' contains error object
	});

	lr.on('line', function (line) {
		// 'line' contains the current line without the trailing newline character.

		LineReaderMasterObject.readLine(line);

	});

	lr.on('end', function () {
		// All lines are read, file is closed now.
		// console.log("LineReaderMasterObject: ", LineReaderMasterObject);
		// console.log("Planets Array: ", LineReaderMasterObject.masterPlanetArray)
		console.log("Total Planets: ", LineReaderMasterObject.masterPlanetArray.length);
		console.log("Non Planet Bullshit found: ", LineReaderMasterObject.nonPlanetFound);

		LineReaderMasterObject.analyzeData({
			region: 'Core Worlds',
			system: 'Coruscant',
			// sector: 'Chiss Space',
			// coordinates: 'M-16'
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

					loadHyperspaceLanes();

				}

			});

		}

	});

});


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

	const systemName = planet.properties.name;
	const x = planet.properties.x;
	const y = planet.properties.y;
	const xLong = planet.properties.point_x;
	const yLong = planet.properties.point_y;
	const lngLat = planet.geometry.coordinates;
	const zoom = planet.properties.zm;
	const link = planet.properties.link;

	const UpdateItem = {
		xGalactic: x,
		yGalactic: y,
		xGalacticLong: xLong,
		yGalacticLong: yLong,
		hasLocation: true,
		LngLat: lngLat,
		zoom: zoom,
		link: link
	};

	DatabaseController.findPlanetAndUpdate({system: systemName}, UpdateItem, function(err, doc){
		if(err) {
			console.log("err: ", err);
			cb(err, {});
		} else if(doc === null) {
			cb(null, false);
		} else {
			cb(null, true);
		}
	});

}


function loadHyperspaceLanes() {

	const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));

	let totalHyperspaceLanes = 0;
	let totalPlanetToPlanetLanes = 0;
	let totalPlanetToEmptyLanes = 0;
	let totalEmptyToEmptyLanes = 0;

	async.eachSeries(HyperspaceLanes.features, function(hyperspaceLane, callbackEach) {

		const hyperspaceLaneProps = hyperspaceLane.properties;
		let hyperspaceCoordinates = hyperspaceLane.geometry.coordinates[0];
		let startCoordinates = hyperspaceCoordinates[0];
		let endCoordintes = hyperspaceCoordinates[ hyperspaceCoordinates.length - 1 ];
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
			const systemA = (firstResult.status)? firstResult.doc.system : "No Name";
			const systemB = (secondResult.status)? secondResult.doc.system : "No Name";

			if((firstResult.status) && (secondResult.status)) {

				totalPlanetToPlanetLanes += 1;

			} else if(firstResult.status || secondResult.status) {

				totalPlanetToEmptyLanes += 1;

			} else {

				totalEmptyToEmptyLanes += 1;

			}

			const TempHyperSpaceLane = new HyperSpaceLane(
				hyperspaceLaneProps.hyperspace, 
				systemA,
				systemB,
				startCoordinates,
				endCoordintes,
				hyperspaceLaneProps.length,
				hyperspaceLaneProps.link
			);

			console.log("TempHyperSpaceLane: ", TempHyperSpaceLane);

			totalHyperspaceLanes += 1;

			console.log("Total Hyperspace Lanes: ", totalHyperspaceLanes);
			console.log("Total Planet To Planet Lanes: ", totalPlanetToPlanetLanes);

			DatabaseController.createHyperLane(TempHyperSpaceLane, function(errorCreate, resultCreate) {

				if(errorCreate) {

					callbackEach(errorCreate);

				} else {

					callbackEach(null);

				}

				
			});

		});


	}, function(errorEach) {

		if(errorEach) {

			console.log("Error setting up hyperspace lanes: ", errorEach);

		}

		console.log("Planet to Empty Space hyperspace lanes: ", totalPlanetToEmptyLanes);
		console.log("Empty Space to Empty Space hyperspace lanes: ", totalEmptyToEmptyLanes);

		DatabaseController.totalPlanetsHasLocation();
		DatabaseController.totalSectors();

	});

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

