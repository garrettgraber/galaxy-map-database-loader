

const mongoose = require('mongoose');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const Planet = require('../data-classes/classes.js').Planet;
const HyperSpaceLane = require('../data-classes/classes.js').HyperSpaceLane;

console.log("Planet: ", Planet);
console.log("HyperSpaceLane: ", HyperSpaceLane);

console.log("DatabaseLinks: ", DatabaseLinks);


const Schema = mongoose.Schema;



function connectToDatabase(cb) {

	mongoose.connect('mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port);

	const db = mongoose.connection;
	db.on('error', function(error) {
		console.error.bind(console, 'connection error:');
		cb(error, {status: false, database:{}});
	});
	db.once('open', function() {
	  // we're connected!
	  	console.log("connected to mongo database ");


	  	cb(null, {
	  		status: true,
	  		database: db,
	  	});
	});
};




const PlanetSchema = new Schema({
    system        : String,
    sector        : { type : Array , "default" : [] },
    region        : String,
    coordinates   : String,
    xGalactic     : Number,
    yGalactic     : Number,
    xGalacticLong : Number,
    yGalacticLong : Number,
    hasLocation   : { type : Boolean, "default": false },
    LngLat        : { type : Array , "default" : [] },
    zoom		  : Number,
    link          : String
});

PlanetSchema.set('autoIndex', true);

const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);


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

	HyperLaneModel.remove({}, function (err, result) {
		if (err) {
			console.log("error emptying collection: ", err);
		} else {
			// console.log("CoordinateModel: ", result);
		}
		// removed!
	});

	SectorModel.remove({}, function (err, result) {
		if (err) {
			console.log("error emptying collection: ", err);
		} else {
			// console.log("CoordinateModel: ", result);
		}
		// removed!
	});	
};

const totalPlanets = () => {

	PlanetModel.count({}, function(err, count) {

		console.log("Total Planets in Database: ", count);

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

const createPlanet = (PlanetCurrent) => {

	PlanetModel.create(PlanetCurrent, function(error, result) {

		if(error) {
			console.log("error adding planet to database: ", error);
		} else {
			console.log("planet added successfully to database: ", result);
		}
	});
};

const findPlanetAndUpdate = (SearchItem, UpdateItem) => {

	PlanetModel.findOneAndUpdate(SearchItem, UpdateItem, function(err, doc){
		if(err) {
			console.log("err: ", err);
		} else {
			// console.log("System has added coordinates: ", doc);
		}
	});		
};

const findOnePlanet = (SearchItem, cb) => {

	PlanetModel.findOne(SearchItem, function(err, doc) {

		if(err) {

			cb(err, null);

		} else {

			cb(null, doc);

		}

	});
};

const createHyperLane = (HyperSpaceLaneCurrent) => {

	HyperLaneModel.create(HyperSpaceLaneCurrent, function(error, result) {

		if(error) {
			console.log("error uploading hyperspace: ", error);
		} else {
			// console.log("hyperspace data uploaded: ", result);
		}

	});
};

const createSector = (sector) => {

	SectorModel.create({name: sector}, function(error, result) {

		if(error) {
			console.log("error adding sector to database: ", error);
		} else {
			console.log("sector added successfully to database: ", result);

			
		}
	});
};

const totalSectors = () => {

	SectorModel.count({}, function(err, count) {

		console.log("Number of sectors in database: ", count);

	});
};

const createCoordinate = (coordinateValue) => {

	CoordinateModel.create({coordinates: coordinateValue}, function(error, result) {

		if(error) {

			console.log("error adding coordinates to database: ", error);

		} else {

			// console.log("coordinates added to database: ", result);
		}

	});
};

const totalCoordinates = () => {

	CoordinateModel.count({}, function(err, count) {

		console.log("Total Coordinates in Database: ", count);

	});
};




module.exports = {
	connectToDatabase: connectToDatabase,
	emptyCollections: emptyCollections,
	totalPlanets: totalPlanets,
	totalCoordinates: totalCoordinates,
	totalSectors: totalSectors,
	getAllPlanets: getAllPlanets,
	searchCoordinate: searchCoordinate,
	findPlanetAndUpdate: findPlanetAndUpdate,
	findOnePlanet: findOnePlanet,
	createPlanet: createPlanet,
	createHyperLane: createHyperLane,
	createSector: createSector,
	createCoordinate: createCoordinate
};