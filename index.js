


const fs = require('fs'),
	_ = require('lodash'),
	LineByLineReader = require('line-by-line'),
	csv = require("fast-csv"),
    lr = new LineByLineReader('./data/StarWarsText2.txt');


const writeToDatabaseGlobal = true;

var DatabaseLinks = require('docker-links').parseLinks(process.env);

console.log("DatabaseLinks: ", DatabaseLinks);



var mongoose = require('mongoose');

var Schema = mongoose.Schema;





function connectToMongoDbase(cb) {


	// console.log("mongoose: ", mongoose);
	// console.log("LoadScripts: ", LoadScripts);
	// console.log("DatabaseLinks: ", DatabaseLinks);
	// console.log("lineReader: ", lineReader);

	mongoose.connect('mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port);

	var db = mongoose.connection;
	db.on('error', function(error) {
		console.error.bind(console, 'connection error:');
		cb(error, {status: false, database:{}});
	});
	db.once('open', function() {
	  // we're connected!
	  	console.log("connected to mongo database ");

	  	// db.createCollection("planets", { size: 2147483648 } )
		// var PlanetSchema = new Schema({
		//     system      : String,
		//     sector      : String,
		//     region      : String,
		//     coordinates : String,
		// });

		// PlanetSchema.set('autoIndex', false);

		// var PlanetModel = mongoose.model('PlanetModel', PlanetSchema);

	 //  	// console.log("collections: ", PlanetModel);


	  	cb(null, {
	  		status: true,
	  		database: db,
	  	});
	});
};


const PlanetSchema = new Schema({
    system      : String,
    sector      : { type : Array , "default" : [] },
    region      : String,
    coordinates : String,
    xGalactic   : String,
    yGalactic   : String,
    hasLocation : { type : Boolean, "default": false },
    LngLat      : { type : Array , "default" : [] },
    zoom		: Number
});

PlanetSchema.set('autoIndex', true);

const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);

// console.log("planets: ", PlanetModel);



const CoordinateSchema = new Schema({
	coordinates: String,
});

CoordinateSchema.set('autoIndex', true);

const CoordinateModel = mongoose.model('CoordinateModel', CoordinateSchema);





const SectorSchema = new Schema({
	name: String,
});

SectorSchema.set('autoIndex', true);

const SectorModel = mongoose.model('SectorModel', SectorSchema);




const HyperLaneSchema = new Schema({
	hyperspace: String,
	start: String,
	end: String,
	startCoords: { type : Array , "default" : [] },
	endCoords: { type : Array , "default" : [] },
	length: Number,
	link: String
});

HyperLaneSchema.set('autoIndex', true);

const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);

// console.log("coordinates: ", CoordinateModel);





// var Schema = mongoose.Schema;

// // console.log("mongoose: ", mongoose);

// // console.log("LoadScripts: ", LoadScripts);
// console.log("DatabaseLinks: ", DatabaseLinks);

// console.log("lineReader: ", lineReader);

// mongoose.connect('mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port);

// console.log("databaseCtrl is starting...");




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

			// console.log("this: ", this);
			// console.log("line: ", line);
			// console.log("line length: ", line.length);

			// var lineSplitArray = line.split('  ');

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
				// console.log("Non Planet Object Found: ", line)

			} else {

				// console.log("systemValue: ", systemValue);
				// console.log("sectorValue: ", sectorValue);
				// console.log("regionValue: ", regionValue);
				// console.log("coordinatesValue: ", coordinatesValue);

				var TempPlanet = new Planet(systemValue, sectorValue, regionValue, coordinatesValue);

				this.masterPlanetArray.push(TempPlanet);

				if(writeToDatabase) {

					PlanetModel.create(TempPlanet, function(error, result) {

						if(error) {
							console.log("error adding planet to database: ", error);
						} else {
							// console.log("planet added successfully to database: ", result);
						}
					});
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

				// var currentCoordinateNumber = currentCoordinateNumber.replace(' and ', '/');

				// console.log("currentCoordinateLetter: ", currentCoordinateLetter);
				// console.log("currentCoordinateNumber: ", currentCoordinateNumber);

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

				// coordinateSet.add(currentCoordinates);
				systemSet.add(currentSystem);
				regionSet.add(currentPlanet.region);

			}


			for (let coordinateTempValue of coordinateSet) {
				// console.log(coordinateTempValue);

				if(writeToDatabase) {

					CoordinateModel.create({coordinates: coordinateTempValue}, function(error, result) {

						if(error) {

							console.log("error adding coordinates to database: ", error);

						} else {

							// console.log("coordinates added to database: ", result);
						}

					});

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


		  //   const planets = _(planetArray)
				// .filter(o => o.region == searchTerm)
				// .map()


			var resultsRegion = _.filter(this.masterPlanetArray,function(item){
		    	return item.region.indexOf(searchTermObject.region) > -1;
		    });


			var resultsSystem = _.filter(this.masterPlanetArray,function(item){
		    	return item.system.indexOf(searchTermObject.system) > -1;
		    });


			// var resultsSector = _.filter(this.masterPlanetArray,function(item){
		 //    	return item.sector.indexOf(searchTermObject.sector) > -1;
		 //    });

			var resultsCoordiantes = _.filter(this.masterPlanetArray,function(item){
		    	return item.coordinates.indexOf(searchTermObject.coordinates) > -1;
		    });


			// if(resultsSector.length > 0) {
			// 	// console.log('resultsSector: ', resultsSector);
			// }

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

		    	// console.log("currentSector: ", currentSector);

		    	SectorModel.create({name: currentSector}, function(error, result) {

					if(error) {
						console.log("error adding sector to database: ", error);
					} else {
						// console.log("planet added successfully to database: ", result);

						
					}
				});

		    }


		    setTimeout(function() {

				SectorModel.find({}, function(err, res) {

					console.log("Number of sectors in database: ", res.length);

				});

		    }, 20*1000);


		    // console.log("sectorSet: ", sectorSet);

		    console.log("Number of Sectors in Set: ", sectorSet.size);
		},


	}
};





const totalPlanets = () => {

	PlanetModel.count({}, function(err, count) {

		console.log("Total Planets in Database: ", count);

	});
};

const totalCoordinates = () => {

	CoordinateModel.count({}, function(err, count) {

		console.log("Total Coordinates in Database: ", count);

	});
};


const coordinatesWithPlanets = () => {

	PlanetModel.find({}, function (err, docs) {
	  // docs.forEach
	 	console.log("planets: ", docs);

	});

};


const getAllPlanets = () => {

	PlanetModel.find({}, function (err, docs) {
	  // docs.forEach
	 	console.log("planets: ", docs);

	});

};

const searchCoordinate = (currentCoordinates) => {

	// console.log("req.query: ", req.query);

	// var system = req.params('system');
	// var region = req.params('region');
	// var sector = req.params('sector');
	// var coordinates = req.params('coordinates');

	PlanetModel.find({coordinates: currentCoordinates}, function(err, docs) {
	  // docs.forEach
	 	console.log("hidden coordinates: ", docs);
	});

};



const emptyCollections = () => {

	console.log("emptyCollections has fired..");

	PlanetModel.remove({}, function (err, result) {
		if (err) {
			console.log("error emptying collection: ", err);
		} else {
			// console.log("PlanetModel: ", result);
		}
		// removed!
	});

	CoordinateModel.remove({}, function (err, result) {
		if (err) {
			console.log("error emptying collection: ", err);
		} else {
			// console.log("CoordinateModel: ", result);
		}
		// removed!
	});

};



connectToMongoDbase(function(err, res) {

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

		totalPlanets();
		totalCoordinates();

		// getCoordinatesFromCSV();
		getCoordinatesFromGeoJson();


		setTimeout(function() {


			loadHyperspaceLanes();



		}, 40 * 1000);

		// var hiddenCoordinates = ["???", "L-4/L-5", "R-11/12", "Q-5/6", "S-5 and S-6", "wjon", "N/A", "L-17/L-18"];


		// for(var i=0; i < hiddenCoordinates.length; i++) {

		// 	var currentHiddenCoordinate = hiddenCoordinates[i];

		// 	console.log("currentHiddenCoordinate: ", currentHiddenCoordinate);

		// 	searchCoordinate(currentHiddenCoordinate);
		// }


		// module.exports = LineReaderMasterObject;

	});

});


function Planet(systemValue, sectorValue, regionValue, coordinatesValue) {

	this.system = systemValue;
	this.sector = sectorValue;
	this.region = regionValue;
	this.coordinates = coordinatesValue;
	this.xGalactic = "";
	this.yGalactic = "";
	this.zoom = 5;
};

class HyperSpaceLane {
	constructor(hyperspace, start, end, startCoords, endCoords, length, link) {
		this.hyperspace = hyperspace || "No Name";
		this.start = start;
		this.end = end;
		this.startCoords = startCoords;
		this.endCoords = endCoords;
		this.length = length;
		this.link = link || "No Link";
	}
}



function foo(){
	console.log("foo has fired...");
}


function getCoordinatesFromGeoJson() {

	const Planets = JSON.parse(fs.readFileSync('./data/planets.geojson', 'utf8'));

	for(let planet of Planets.features) {

		// console.log("planet: ", planet);

		const systemName = planet.properties.name;
		const x = planet.properties.x;
		const y = planet.properties.y;
		const lngLat = planet.geometry.coordinates;
		const zoom = planet.properties.zm;

		const UpdateItem = {
			xGalactic: x,
			yGalactic: y,
			hasLocation: true,
			LngLat: lngLat,
			zoom: zoom
		};


		PlanetModel.findOneAndUpdate({system: systemName}, UpdateItem, function(err, doc){
			if(err) {
				console.log("err: ", err);
			} else {
				// console.log("System has added coordinates: ", doc);
			}
		});		

	}

}


function loadHyperspaceLanes() {

	const HyperspaceLanes = JSON.parse(fs.readFileSync('./data/hyperspace.geojson', 'utf8'));

	let totalHyperspaceLanes = 0;

	for(let hyperspaceLane of HyperspaceLanes.features) {

		const hyperspaceLaneProps = hyperspaceLane.properties;
		let hyperspaceCoordinates = hyperspaceLane.geometry.coordinates[0];
		let startCoordinates = hyperspaceCoordinates[0];
		let endCoordintes = hyperspaceCoordinates[ hyperspaceCoordinates.length - 1 ];
		let startSystem, endSystem;

		PlanetModel.findOne({LngLat: startCoordinates}, function(err, doc) {

			if(err) {

				console.log("err: ", err);

			} else {
				// console.log("System has added coordinates: ", doc);

				PlanetModel.findOne({LngLat: endCoordintes}, function(err2, doc2) {

					if(err2) {

						console.log("err2: ", err2);

					} else {

						// console.log("System has added coordinates: ", doc);
						// console.log("\nHyperspace Lane: ", hyperspaceLaneProps.hyperspace);
						// console.log("Length: ", hyperspaceLaneProps.length);
						// console.log("Start Found: ", (doc)? doc.system : startCoordinates);
						// console.log("End Found: ", (doc2)? doc2.system : endCoordintes);

						const systemA = (doc)? doc.system : "No Name";
						const systemB = (doc2)? doc2.system : "No Name";

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

						HyperLaneModel.create(TempHyperSpaceLane, function(error, result) {

							if(error) {
								console.log("error uploading hyperspace: ", error);
							} else {
								// console.log("hyperspace data uploaded: ", result);
							}

						});

					}

				});

			}

		});

	}


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

			PlanetModel.findOneAndUpdate({system: systemName}, UpdateItem, function(err, doc){
				if(err) {
					console.log("err: ", err);
				} else {
					console.log("System has added coordinates: ", doc);
				}
			});

	    })
	    .on("end", function(){
	         console.log("done reading planets.csv");
	    });
	 
	stream.pipe(csvStream);

}

