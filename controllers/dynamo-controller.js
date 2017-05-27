
const AWS = require('aws-sdk');
// const DatabaseLinks = require('docker-links').parseLinks(process.env);
const attr = require('dynamodb-data-types').AttributeValue;
const async = require('async');


AWS.config.loadFromPath('../config.json');


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


const BL = Bespin.geometry;
const BP = Bespin.properties;


const BespinLocationDynamoData = attr.wrap(BL);

// console.log("bespin dynamodb: ", BespinLocationDynamoData);

const BespinLocationDynamoDataUnwrapped = attr.unwrap(BespinLocationDynamoData);

// console.log("bespin data: ", BespinLocationDynamoDataUnwrapped);


const BespinObject = new Planet(BP.name, BP.sector, BP.region, BP.grid, BP.x, BP.y, BP.point_x, BP.point_y, true, BL.coordinates, BP.zm, BP.link);


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
	TableName: "Sector"
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
	TableName: "HyperLane"
};


const TableSchemaArray = [paramsPlanets, paramsCoordinates, paramsSectors, paramsHyperLane];

connectToDatabase(function(err, res) {

	if(err) {
		console.log("Error setting up dynamodb database!");
	} else {
		console.log("Dynamodb database successfully setup!");
	}
});

function connectToDatabase(cb) {

	createAllTables(TableSchemaArray, function(err, res) {

		if(err) {
			cb(err, {status: false});

		} else {
			cb(null, {status: true});

		}

	});
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
			console.log(err, err.stack); // an error occurred
			callback(err);
		} else {
			console.log("data: ", data);  // successful response
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
