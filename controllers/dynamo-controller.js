
const AWS = require('aws-sdk');
// const DatabaseLinks = require('docker-links').parseLinks(process.env);
const attr = require('dynamodb-data-types').AttributeValue;


AWS.config.loadFromPath('../config.json');


const Planet = require('../data-classes/classes.js').Planet;
const HyperSpaceLane = require('../data-classes/classes.js').HyperSpaceLane;

console.log("Planet: ", Planet);
console.log("HyperSpaceLane: ", HyperSpaceLane);


// console.log("DatabaseLinks: ", DatabaseLinks);


const dynamodb = new AWS.DynamoDB();

const docClient = new AWS.DynamoDB.DocumentClient();


console.log("dynamodb: ", dynamodb);



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

console.log("bespin dynamodb: ", BespinLocationDynamoData);

const BespinLocationDynamoDataUnwrapped = attr.unwrap(BespinLocationDynamoData);

console.log("bespin data: ", BespinLocationDynamoDataUnwrapped);


const BespinObject = new Planet(BP.name, BP.sector, BP.region, BP.grid, BP.x, BP.y, BP.point_x, BP.point_y, true, BL.coordinates, BP.zm, BP.link);


console.log("BespinObject: ", BespinObject);

var params = {
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


console.log("params: ", params);

dynamodb.createTable(params, function(err, data) {
	if (err){
		console.log(err, err.stack); // an error occurred
	} else {
		console.log(data);  // successful response
		uploadData();

	}              
   
});

function uploadData() {

	const PutObject = {
		TableName: "Planets",
		Item: BespinObject
	};

	docClient.put(PutObject, function(err, data) {
		if (err) {
			console.error("Unable to add movie", err);
		} else {
			console.log("PutItem succeeded:", data);

			getData(BespinObject.system);
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
