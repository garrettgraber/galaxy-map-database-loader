
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const DatabaseLinks = require('docker-links').parseLinks(process.env);
const attr = require('dynamodb-data-types').AttributeValue;
const async = require('async');


// console.log("DatabaseLinks: ", DatabaseLinks);


console.log("Loading dynamodb!");

// console.log("__dirname: ", __dirname);

AWS.config.loadFromPath(path.join(__dirname, 'config.json'));

if(DatabaseLinks.hasOwnProperty('dynamodb')) {

	const dynamodbEndpoint = 'http://' + DatabaseLinks.dynamodb.hostname + ':' + DatabaseLinks.dynamodb.port;


	AWS.config.update({ endpoint: new AWS.Endpoint(dynamodbEndpoint) });

}


const Planet = require('../data-classes/classes.js').Planet;
const HyperSpaceLane = require('../data-classes/classes.js').HyperSpaceLane;

// console.log("Planet: ", Planet);
// console.log("HyperSpaceLane: ", HyperSpaceLane);


// console.log("DatabaseLinks: ", DatabaseLinks);


const dynamodb = new AWS.DynamoDB();

const docClient = new AWS.DynamoDB.DocumentClient();


// console.log("dynamodb: ", dynamodb);



const Bespin = {
	"type":"Feature",
	"geometry":
		{
			"type":"Point",
			"coordinates":[-12.845516,-74.565245]
		},
	"properties":
		{
			"cartodb_id":384,
			"zm":0,
			"canon":1,
			"uid":383,
			"region":"Outer Rim",
			"sector":["Anoat"],
			"grid":"K18",
			"link":"http://starwars.wikia.com/wiki/Bespin",
			"name_web":"Bespin",
			"name_alt":"Lando",
			"name":"Bespin",
			"point_y":-12747.8495758,
			"point_x":-1429.95624641,
			"y":-12747.85,
			"x":-1429.96
		}
};


const Coruscant = {
	"type":"Feature",
	"geometry":
		{
			"type":"Point",
			"coordinates":[0,0]
		},
	"properties":
		{
			"cartodb_id":178,
			"zm":0,
			"canon":1,
			"uid":177,
			"region":"Core",
			"sector":null,
			"grid":null,
			"link":"http://starwars.wikia.com/wiki/Coruscant",
			"name_web":"Coruscant",
			"name_alt":null,
			"name":"Coruscant",
			"point_y":0,
			"point_x":0,
			"y":0,
			"x":0
		}
};


const BL = Bespin.geometry;
const BP = Bespin.properties;
const CL = Coruscant.geometry;
const CP = Coruscant.properties;


const BespinLocationDynamoData = attr.wrap(BL);

// console.log("bespin dynamodb: ", BespinLocationDynamoData);

const BespinLocationDynamoDataUnwrapped = attr.unwrap(BespinLocationDynamoData);

// console.log("bespin data: ", BespinLocationDynamoDataUnwrapped);


const BespinObject = new Planet(BP.name, BP.sector, BP.region, BP.grid, BP.x, BP.y, BP.point_x, BP.point_y, true, BL.coordinates, BP.zm, BP.link);

const CoruscantObject = new Planet(CP.name, CP.sector, CP.region, CP.grid, CP.x, CP.y, CP.point_x, CP.point_y, true, CL.coordinates, CP.zm, CP.link)


// console.log("BespinObject: ", BespinObject);

const paramsPlanets = {
	AttributeDefinitions: [
		{
			AttributeName: "system", 
			AttributeType: "S"
		}
	], 
  	KeySchema: [
		{
			AttributeName: "system", 
			KeyType: "HASH"
   		}
	], 
	ProvisionedThroughput: {
		ReadCapacityUnits: 5, 
		WriteCapacityUnits: 5
	}, 
	TableName: "Planets"
};

const paramsCoordinates = {
	AttributeDefinitions: [
		{
			AttributeName: "coordinates", 
			AttributeType: "S"
		}
	], 
  	KeySchema: [
		{
			AttributeName: "coordinates", 
			KeyType: "HASH"
   		}
	], 
	ProvisionedThroughput: {
		ReadCapacityUnits: 5, 
		WriteCapacityUnits: 5
	}, 
	TableName: "Coordinates"
};


const paramsSectors = {
	AttributeDefinitions: [
		{
			AttributeName: "name", 
			AttributeType: "S"
		}
	], 
  	KeySchema: [
		{
			AttributeName: "name", 
			KeyType: "HASH"
   		}
	], 
	ProvisionedThroughput: {
		ReadCapacityUnits: 5, 
		WriteCapacityUnits: 5
	}, 
	TableName: "Sectors"
};


const paramsHyperLane = {
	AttributeDefinitions: [
		{
			AttributeName: "hid", 
			AttributeType: "N"
		}
	], 
  	KeySchema: [
		{
			AttributeName: "hid", 
			KeyType: "HASH"
   		}
	], 
	ProvisionedThroughput: {
		ReadCapacityUnits: 5, 
		WriteCapacityUnits: 5
	}, 
	TableName: "HyperLanes"
};


const TableSchemaArray = [paramsPlanets, paramsCoordinates, paramsSectors, paramsHyperLane];

function connectToDatabase(cb) {

	async.eachSeries(TableSchemaArray, createTable, function(err) {

		if(err) {
			console.log("error creating tables: ", err);
			cb(err, {status: false});
		} else {
			console.log("All tables created successfully!");
			cb(null, {status: true, db: dynamodb});
		}

	});

	// createAllTables(TableSchemaArray, function(err, res) {

	// 	cb(err, )

	// 	if(err) {
	// 		cb(err, {status: res});
	// 	} else {
	// 		cb(null, {status: res});
	// 	}

	// 	// if(err) {
	// 	// 	cb(err, {status: res});

	// 	// } else {
	// 	// 	cb(null, {status: res});

	// 	// }

	// });
};

function createAllTables(tableSchema, cb) {

	async.eachSeries(tableSchema, createTable, function(err) {

		if(err) {
			console.log("error creating tables: ", err);
			cb(err, false);
		} else {
			console.log("All tables created successfully!");
			cb(null, true);
		}

	});
};


function createTable(params, callback) {

	console.log("params: ", params);

	dynamodb.createTable(params, function(err, data) {
		if (err){
			// console.log(err, err.stack);
			callback(err);
		} else {
			// console.log("data: ", data);  
			// uploadData(BespinObject);
			callback(null);

		}              
	   
	});

};


function uploadData(PlanetObject) {

	const PutObject = {
		TableName: "Planets",
		Item: PlanetObject
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("Unable to add movie", err);
		} else {
			console.log("PutItem succeeded:", data);

			getData(PlanetObject.system);
		}
	});

}


function getData(system) {

	var paramsTemp = {
	    TableName: "Planets",
	    Key:{
	        "system": system
	    }
	};

	docClient.get(paramsTemp, function(err, data) {
	    if (err) {
	        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
	    }
	});

}


const createPlanet = (PlanetObject) => {

	const PutObject = {
		TableName: "Planets",
		Item: PlanetObject
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("Planet creation error", err);
		} else {
			console.log("Planet created:", data);
		}
	});

}

const createHyperLane = (HyperSpaceLaneCurrent, cb) => {

	const PutObject = {
		TableName: "HyperLanes",
		Item: HyperSpaceLaneCurrent
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("HyperLane creation error", err);
			cb(err, {});
		} else {
			console.log("HyperLane created:", data);
			cb(null, data);
		}
	});

}

const createSector = (sector) => {

	const PutObject = {
		TableName: "Sectors",
		Item: {name: sector}
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("Sector creation error", err);
		} else {
			console.log("Sector created:", data);
		}
	});
}

const createCoordinate = (coordinateValue) => {

	const PutObject = {
		TableName: "Coordinates",
		Item: {coordinates: coordinateValue}
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("Coordinate creation error", err);
		} else {
			console.log("Coordinate created:", data);
		}
	});

}

const totalPlanets = () => {

	const ScanParams = {
		TableName: "Planets",
		Select:'COUNT'
	};

	docClient.scan(ScanParams, function(err, data) {

		console.log("Total Planets in Database: ", data.Count);

	});

}


const totalSectors = () => {

	const ScanParams = {
		TableName: "Sectors",
		Select:'COUNT'
	};

	docClient.scan(ScanParams, function(err, data) {

		console.log("Total Sectors in Database: ", data.Count);

	});

};


const totalCoordinates = () => {

	const ScanParams = {
		TableName: "Coordinates",
		Select:'COUNT'
	};

	docClient.scan(ScanParams, function(err, data) {

		console.log("Total Coordinates in Database: ", data.Count);

	});

};


const totalPlanetsHasLocation = () => {

	const ScanParams = {
		TableName: "Planets",
		FilterExpression: "hasLocation = :locationValue",
        ExpressionAttributeValues: {
            ":locationValue": true
        },
        Select:'COUNT'
	};

	docClient.scan(ScanParams, function(err, data) {

		console.log("Total Planets with locations in the Database: ", data.Count);

	});

};


const findOnePlanet = (SearchItem, cb) => {

	const ScanParams = createParams(SearchItem, "Planets");

	console.log("ScanParams: ", ScanParams);

	docClient.scan(ScanParams, function(err, data) {

		console.log("findOnePlanet data: ", data);

		if(err) {

			cb(err, {status: false, doc: null});

		} else if(data === null) {

			cb(null, {status: false, doc: null});

		} else {

			cb(null, {status: true, doc: data.Items[0]});

		}

	});	

}

const findPlanetAndUpdate = (SearchItem, UpdateItem, cb) => {

	findOnePlanet(SearchItem, function(error, result) {

		if(result.status) {

			const params = {
		        TableName: "Planets",
		        Key: {
		            "system": result.doc.system
		        },
		        UpdateExpression: "set #zoom = :zm, #yGalactic = :y, #xGalactic = :x, #hasLocation = :location",
		       	ExpressionAttributeNames: {
                    '#zoom': 'zoom', //COLUMN NAME
                    '#yGalactic': 'yGalactic',
                    '#xGalactic': 'xGalactic',
                    '#hasLocation': 'hasLocation'    
                },
		        ExpressionAttributeValues: {
		            ":x": UpdateItem.xGalactic,
		            ":y": UpdateItem.yGalactic,
		            ":location": UpdateItem.hasLocation,
		            ":zm": UpdateItem.zoom
		        }
		    };


		    docClient.update(params, function(err, data) {
		        if(err) {
					console.log("err: ", err);
					cb(err, {});
				} else {
					// console.log("System has added coordinates: ", doc);
					console.log("Successfully updated planet: ", data);
					cb(null, data);
				}
		    });

		}

	});
}

function createParams(SearchParams, TableName) {

	let ScanParams = {
		TableName: TableName,
	};

	if(SearchParams.hasOwnProperty('LngLat')) {

		let FilterExpression = "LngLat = :lngLatArray";
		ScanParams.ExpressionAttributeValues = {
			':lngLatArray': SearchParams.LngLat
		};
		ScanParams.FilterExpression = FilterExpression;
	}

	if(SearchParams.hasOwnProperty("system")) {

		let FilterExpression = "#system = :systemValue";
		ScanParams.ExpressionAttributeValues = {
			':systemValue': SearchParams.system
		};
		ScanParams.ExpressionAttributeNames = {
			"#system": "system"
		}
		ScanParams.FilterExpression = FilterExpression;
	}

	return ScanParams;

}



if(false) {

	connectToDatabase(function(err, res) {

		if(err) {
			console.log("Error setting up dynamodb database!");
		} else {
			console.log("Dynamodb database successfully setup!");

			createPlanet(BespinObject);
			createPlanet(CoruscantObject);

			setTimeout(function() {

				totalPlanets();
				totalPlanetsHasLocation();

				// findOnePlanet({LngLat: [-12.845516,-74.565245]}, function(error, result) {

				// 	if(error) {
				// 		console.log("error found: ", error);
				// 	} else {
				// 		console.log("planet found: ", result);
				// 	}

				// });

				// findOnePlanet({system:"Coruscant"}, function(error, result) {

				// 	if(error) {
				// 		console.log("error found: ", error);
				// 	} else {
				// 		console.log("planet found: ", result);
				// 	}

				// });

				findPlanetAndUpdate({system:"Coruscant"},{hasLocation: false, zoom: 3, xGalactic: 0.0, yGalactic: 0.0},function(error, doc) {
					
					console.log("doc: ", doc);


					findOnePlanet({system:"Coruscant"}, function(error, result) {

						console.log("CoruscantObject: ", CoruscantObject);


						if(error) {
							console.log("error found: ", error);
						} else {
							console.log("planet found: ", result);
						}

					});				

				});

			}, 8 * 1000);		

		}
	});


}





module.exports = {
	connectToDatabase: connectToDatabase,
	totalPlanets: totalPlanets,
	totalCoordinates: totalCoordinates,
	totalSectors: totalSectors,
	totalPlanetsHasLocation: totalPlanetsHasLocation,
	findPlanetAndUpdate: findPlanetAndUpdate,
	findOnePlanet: findOnePlanet,
	createPlanet: createPlanet,
	createHyperLane: createHyperLane,
	createSector: createSector,
	createCoordinate: createCoordinate
};

// {
// 	AttributeName: "sector", 
// 	AttributeType: "NS"
// },
// {
// 	AttributeName: "region", 
// 	AttributeType: "S"
// },
// {
// 	AttributeName: "coordinates", 
// 	AttributeType: "S"
// },
// {
// 	AttributeName: "xGalactic", 
// 	AttributeType: "N"
// },
// {
// 	AttributeName: "yGalactic", 
// 	AttributeType: "N"
// },
// {
// 	AttributeName: "xGalacticLong", 
// 	AttributeType: "N"
// },
// {
// 	AttributeName: "yGalacticLong", 
// 	AttributeType: "N"
// },
// {
// 	AttributeName: "hasLocation",
// 	AttributeType: "BOOL"
// },
// {
// 	AttributeName: "LngLat",
// 	AttributeType: "NS"
// },
// {
// 	AttributeName: "zoom", 
// 	AttributeType: "N"
// },
// {
// 	AttributeName: "link", 
// 	AttributeType: "S"
// },
