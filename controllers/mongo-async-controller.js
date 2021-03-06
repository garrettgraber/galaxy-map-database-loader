const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;

const DatabaseLinks = require('docker-links').parseLinks(process.env);
const HyperSpaceLane = require('../data-classes/classes.js').HyperSpaceLane;
const Alphabets = require('../data-classes/alphabets.js');
const Schema = mongoose.Schema;


console.log("DatabaseLinks: ", DatabaseLinks);
console.log("NODE_ENV: ", process.env.NODE_ENV);
const isDeveloping = process.env.NODE_ENV !== 'production';
const isProduction = process.env.NODE_ENV === 'production';
console.log("isProduction: ", isProduction);


if(DatabaseLinks.hasOwnProperty('mongo') && isDeveloping) {
  var MONGO = 'mongodb://' + DatabaseLinks.mongo.hostname + ':' + DatabaseLinks.mongo.port;
} else if (isProduction) {
	var MONGO = 'mongodb://172.31.79.220:27017/test';
} else {
	// var TILES = 'http://localhost:8110/tiles-leaflet-new/{z}/{x}/{y}.png';
	console.log("mongo failure!!!!");
}


console.log("MONGO: ", MONGO);


function connectToDatabase(cb) {
	mongoose.connect(MONGO);
	const db = mongoose.connection;
	db.on('error', function(error) {
		console.log('connection error:', error);
		cb(error, {status: false, database:{}});
	});
	db.once('open', function() {
  	console.log("connected to mongo database ");
  	cb(null, {
  		status: true,
  		database: db,
  	});
	});
};

const connectToMongo = Promise.promisify(connectToDatabase);

const PlanetSchema = new Schema({
    system         : String,
    sector         : { type : Array , "default" : [] },
    region         : String,
    coordinates    : String,
    xGalactic      : Number,
    yGalactic      : Number,
    xGalacticLong  : Number,
    yGalacticLong  : Number,
    hasLocation    : { type : Boolean, "default": false },
    LngLat         : { type : Array , "default" : [] },
    lng            : { type : Number , "default" : null },
    lat            : { type : Number , "default" : null },
    zoom		   		 : Number,
    link           : String
});
PlanetSchema.set('autoIndex', true);
const PlanetModel = mongoose.model('PlanetModel', PlanetSchema);

const HyperspaceNodeSchema = new Schema({
    system         : String,
    lng            : { type : Number , "default" : null },
    lat            : { type : Number , "default" : null },
    xGalactic      : { type : Number , "default" : null },
    yGalactic      : { type : Number , "default" : null },
    yGalacticLong  : { type : Number , "default" : null },
    xGalacticLong  : { type : Number , "default" : null },
    hyperspaceLanes: { type : Array , "default" : [] },
    nodeId         : { type : Number, "default" : null },
    loc            : { type : Array, "default" : [] },
    geoHash        : String,
    zoom					 : Number,
    emptySpace     : Boolean
});
HyperspaceNodeSchema.set('autoIndex', true);
HyperspaceNodeSchema.index({ loc: '2d' });
const HyperspaceNodeModel = mongoose.model('HyperspaceNodeModel', HyperspaceNodeSchema);

const CoordinateSchema = new Schema({
	coordinates: String,
});
CoordinateSchema.set('autoIndex', true);
const CoordinateModel = mongoose.model('CoordinateModel', CoordinateSchema);

const SectorSchema = new Schema({
	name: String,
	coordinates: { type : Array , "default" : [] },
	link: { type : String , "default" : '' }
});
SectorSchema.set('autoIndex', true);
const SectorModel = mongoose.model('SectorModel', SectorSchema);

const HyperLaneSchema = new Schema({
	name: String,
	hyperspaceHash: String,
	start: String,
	end: String,
	startCoordsLngLat: { type : Array , "default" : [] },
	endCoordsLngLat: { type : Array , "default" : [] },
	length: Number,
	link: String,
	startNodeId: { type : Object, "default" : {} },
	endNodeId: { type : Object, "default" : {} },
	coordinates: [
		[Number, Number]
	],
	laneId: Number
});
HyperLaneSchema.set('autoIndex', true);
const HyperLaneModel = mongoose.model('HyperLaneModel', HyperLaneSchema);

const createHyperspaceNode = (HyperspaceNodeCurrent, cb) => {
	HyperspaceNodeModel.find({lat: HyperspaceNodeCurrent.lat, lng: HyperspaceNodeCurrent.lng}).exec()
		.then(hyperspaceNodeData => {
			if(hyperspaceNodeData.length == 0) {
				HyperspaceNodeModel.create(HyperspaceNodeCurrent)
					.then(hyperspaceNodeCreationResult => {
						cb(null, null);
					}).catch(errorCreatingNode => {
						console.log("error adding hyperspace node to database: ", errorCreatingNode);
						cb(error, null);
					});
			} else {
				const result = hyperspaceNodeData[0];
				const foundHyperspaceLane = HyperspaceNodeCurrent.hyperspaceLanes[0];
				let updatedHyperlanes = [];
				if(!result.hyperspaceLanes.includes(foundHyperspaceLane)) {
					updatedHyperlanes = HyperspaceNodeCurrent.hyperspaceLanes.concat(result.hyperspaceLanes);
					HyperspaceNodeModel.findOneAndUpdate({system: result.system}, {hyperspaceLanes: updatedHyperlanes}, {new: true}).exec().then(nodeAddedData => {
							console.log("Hyperspace Node has added hyperspace lane: ", nodeAddedData);
							cb(null, null);
					}).catch(errNodeAdd => {
							console.log("error adding node: ", errNodeAdd);
							cb(errNodeAdd, null);
					});
				} else {
					if(result.system !== HyperspaceNodeCurrent.system) {
						console.log("\nresult.system: ", result.system);
						console.log("HyperspaceNodeCurrent.system: ", HyperspaceNodeCurrent.system);
						cb(null, result.system);
					} else {
						cb(null, null);
					}
				}
			}
		}).catch(hyperspaceNodeError => {
			cb(err, null);
		});
};


const createHyperspaceNodeAsync = async (HyperspaceNodeCurrent) => {
	try {
		return await HyperspaceNodeModel.create(HyperspaceNodeCurrent);
	} catch(err) {
		// console.log("error creating hyperspace node: ", err);
		throw new Error(400);
	}
};


// const createHyperspaceNodeAsync = async (HyperspaceNodeCurrent) => {

// 	try {
// 		const hyperspaceNodeData = await HyperspaceNodeModel.find({
// 			lat: HyperspaceNodeCurrent.lat,
// 			lng: HyperspaceNodeCurrent.lng
// 		}).exec();

// 		if(hyperspaceNodeData.length == 0) {
// 			return await HyperspaceNodeModel.create(HyperspaceNodeCurrent);
// 		} else {
// 			const result = hyperspaceNodeData[0];

// 			// if(result.system === undefined) {
// 			// 	console.log("\nresult.system: ", result.system);
// 			// 	console.log("HyperspaceNodeCurrent: ", HyperspaceNodeCurrent);
// 			// }
// 			// console.log("Hyperspace Lane: ", HyperspaceNodeCurrent.hyperspaceLanes);

// 			const foundHyperspaceLane = HyperspaceNodeCurrent.hyperspaceLanes[0];
// 			let updatedHyperlanes = [];
// 			if(!result.hyperspaceLanes.includes(foundHyperspaceLane) && result.system === undefined) {
// 				updatedHyperlanes = HyperspaceNodeCurrent.hyperspaceLanes.concat(result.hyperspaceLanes);
// 				return await HyperspaceNodeModel.findOneAndUpdate({system: result.system}, {hyperspaceLanes: updatedHyperlanes}, {new: true}).exec();
// 			} else {
// 				if(result.system !== HyperspaceNodeCurrent.system) {

// 					return result.system;
// 				} else {
// 					return ;
// 				}
// 			}
// 		}
// 	} catch(err) {
// 		// console.log("error creating hyperspace node: ", err);
// 		throw new Error(400);
// 	}
// };

const findHyperspaceNodeAndUpdate = async (SearchItem, UpdateItem) => {
	try {
		return await HyperspaceNodeModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findHyperspaceLaneAndUpdateAsync = async (SearchItem, UpdateItem) => {
	try {
		return await HyperLaneModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findOneHyperspaceNodeAsync = async (SearchItem) => {
	try {
		return await HyperspaceNodeModel.findOne(SearchItem).exec();
	} catch(err) {
		console.log("error updating hyperspace node: ", err);
		throw new Error(400);
	}
};

const findOnePlanet = async (SearchItem) => {
	try {
		const planetData = await PlanetModel.findOne(SearchItem).exec();
		if(planetData === null) {
			return {status: false, doc: null};
		} else {
			return {status: true, doc: planetData};
		}
	} catch(err) {
		console.log("error updating planet: ", err);
		throw new Error(400);
	}
};

const emptyCollections = async () => {
	try {
		console.log("emptyCollections has fired..");
		const databasePromiseArray = [
			await PlanetModel.remove({}).exec(),
			await CoordinateModel.remove({}).exec(),
			await HyperLaneModel.remove({}).exec(),
			await SectorModel.remove({}).exec(),
			await HyperspaceNodeModel.remove({}).exec()
		];
		return await Promise.all(databasePromiseArray);
	} catch(err) {
	  console.log("error clearing all the collections: ", err);
	}
};

const getAllHyperspaceNodes = async () => {
	try {
		return await HyperspaceNodeModel.find({}).exec();
	} catch(err) {
		console.log("error getting all hyperspace nodes: ", err);
	}
};

const getAllPlanets = async () => {
	try {
		return await PlanetModel.find({}).exec();
	} catch(err) {
		console.log("error getting all planets: ", err);
	}
};

const findPlanetAndUpdate = async (SearchItem, UpdateItem) => {
	try {
		return await PlanetModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("error updating planet: ", SearchItem);
		console.log("update item: ", UpdateItem);
		console.log("error: ", err);
	}
};

const createHyperspaceLane = async (HyperSpaceLaneCurrent) => {
	try {
		return await HyperLaneModel.create(HyperSpaceLaneCurrent);
	} catch(err) {
		console.log("error uploading hyperspace: ", err);
	}
};

const getAllHyperspaceLanes = async () => {
	try {
		return await HyperLaneModel.find({}).exec();
	} catch(err) {
		console.log("error getting all hyperspace lanes: ", err);
	}
};

const totalHyperspaceNodes = async () => {
	try {
		return await HyperspaceNodeModel.count({}).exec();
	} catch(err) {
		console.log("error getting total hyperspace nodes: ", err);
	}
};

const totalPlanets = async () => {
	try {
		return await PlanetModel.count({}).exec();
	} catch(err) {
		console.log("error getting total planets: ", err);
	}
};

const totalPlanetsHasLocation = async () => {
	try {
		return await PlanetModel.count({hasLocation: true}).exec();
	} catch(err) {
		console.log("error getting total planets with a location: ", err);
	}
};

const createPlanet = async (PlanetCurrent) => {
	try {
		return await PlanetModel.create(PlanetCurrent);
	} catch(err) {
		console.log("error adding planet to database: ", err);
	}
};

const totalHyperspaceLanes = async () => {
	try {
		return await HyperLaneModel.count({}).exec();
	} catch(err) {
		console.log("error getting total hyperspace lanes: ", err);
	}
};

const createSector = async (sector) => {
	try {
		return await SectorModel.create({name: sector});
	} catch(err) {
		console.log("error adding sector to database: ", err);
	}
};

const createSectorData = async (Sector) => {
	try {
		return await SectorModel.create(Sector);
	} catch(err) {
		console.log("error adding sector to database: ", err);
	}
};

const totalSectors = async () => {
	try {
		return await SectorModel.count({}).exec();
	} catch(err) {
		console.log("error getting total sectors from the database: ", err);
	}
};


const findSectorAsync = async (SearchItem) => {
	try {
		return await SectorModel.find(SearchItem).exec();
	} catch(err) {
		throw new Error(404);
	}
}

const findSectorAndUpdate = async (SearchItem, UpdateItem) => {
	try {
		return await SectorModel.findOneAndUpdate(SearchItem, UpdateItem, {new: true}).exec();
	} catch(err) {
		console.log("find sector and update error: ", err);
	}
};

const createCoordinate = async (coordinateValue) => {
	try {
		return await CoordinateModel.create({coordinates: coordinateValue});
	} catch(err) {
		console.log("error adding coordinates to database: ", err);
	}
};

const totalCoordinates = async () => {
	try {
		return await CoordinateModel.count({}).exec();
	} catch(err) {
		console.log("error getting total coordinates: ", err);
	}
};

const searchCoordinate = async (currentCoordinates) => {
	try {
		return await PlanetModel.find({coordinates: currentCoordinates}).exec();
	} catch(err) {
		console.log("error searching coordinates: ", err);
	}
};


module.exports = {
	connectToDatabase: connectToDatabase,
	connectToMongo: connectToMongo,
	createHyperspaceNode: createHyperspaceNode,
	createHyperspaceNodeAsync: createHyperspaceNodeAsync,
	totalHyperspaceNodes: totalHyperspaceNodes,
	findHyperspaceNodeAndUpdate: findHyperspaceNodeAndUpdate,
	findOneHyperspaceNodeAsync: findOneHyperspaceNodeAsync,
	emptyCollections: emptyCollections,
	totalPlanets: totalPlanets,
	totalCoordinates: totalCoordinates,
	totalSectors: totalSectors,
	getAllPlanets: getAllPlanets,
	getAllHyperspaceNodes: getAllHyperspaceNodes,
	searchCoordinate: searchCoordinate,
	findPlanetAndUpdate: findPlanetAndUpdate,
	findOnePlanet: findOnePlanet,
	totalPlanetsHasLocation: totalPlanetsHasLocation,
	createPlanet: createPlanet,
	createHyperspaceLane: createHyperspaceLane,
	totalHyperspaceLanes: totalHyperspaceLanes,
	getAllHyperspaceLanes: getAllHyperspaceLanes,
	createSector: createSector,
	createSectorData: createSectorData,
	createCoordinate: createCoordinate,
	findHyperspaceLaneAndUpdateAsync: findHyperspaceLaneAndUpdateAsync,
	findSectorAsync: findSectorAsync,
	findSectorAndUpdate: findSectorAndUpdate
};

