const _ = require('lodash'),
	uuidv1 = require('uuid/v1'),
  uuidv4 = require('uuid/v4'),
  Geohash = require('latlon-geohash'),
  hash = require('string-hash');

class Planet {
	constructor(
		systemValue,
		sectorValue,
		regionValue,
		coordinatesValue,
		xGalactic = 0,
		yGalactic = 0,
		xGalacticLong = 0,
		yGalacticLong = 0,
		hasLocation = false,
		LngLat = [],
		lat = null,
		lng = null,
		zoom = 5,
		link = '',
		textWidth = 0
	) {
		this.system = systemValue;
		this.sector = sectorValue;
		this.region = regionValue;
		this.coordinates = coordinatesValue;
		this.xGalactic = xGalactic;
		this.yGalactic = yGalactic;
		this.xGalacticLong = xGalacticLong;
		this.yGalacticLong = yGalacticLong;
		this.hasLocation = hasLocation;
		this.LngLat = LngLat;
		this.lng = (LngLat.length)? LngLat[0] : null;
		this.lat = (LngLat.length)? LngLat[1] : null;
		this.zoom = zoom;
		this.link = link;
		this.textWidth = textWidth;
	}

	starInMapView(mapWidth, mapHeight, MapBoundaries) {
	    const mapOffSetLng = 0;
	    const mapOffSetLat = 0;
	    const inNorthSouthRange = (MapBoundaries.south < this.lat && this.lat < MapBoundaries.north) ? true : false;
	    const inEastWestRange = (MapBoundaries.west< this.lng && this.lng < MapBoundaries.east) ? true : false;
	    const objectInvView = (inNorthSouthRange && inEastWestRange) ? true : false;
	    return objectInvView;
	}

	starIsVisible(currentZoom) {
		let starIsViewableAtZoom = false;
    if(this.zoom === 0) {
			starIsViewableAtZoom = true;
    } else if(this.zoom === 1 && currentZoom >= 3) {
    	starIsViewableAtZoom = true;
    } else if(this.zoom === 2 && currentZoom >= 5) {
    	starIsViewableAtZoom = true;
    } else if(this.zoom === 3 && currentZoom >= 6) {
    	starIsViewableAtZoom = true;
    } else {
    	starIsViewableAtZoom = false;
    }
      return starIsViewableAtZoom;
  }

	galaticXYtoMapPoints(xGalactic, yGalactic) {
    const galacticOffset = 19500;
    const galacticDivisor = 39.0;
    let yPoint;
    if(yGalactic > 0 && xGalactic > 0) {
      yPoint = -(yGalactic - galacticOffset) / galacticDivisor;
    } else if (yGalactic < 0) {
      yPoint = ((-yGalactic) + galacticOffset) /  galacticDivisor;
    } else if(yGalactic > 0 && xGalactic < 0) {
      yPoint = (galacticOffset - yGalactic) / galacticDivisor;
    }
    if(yGalactic === 0) {
      yPoint = 0;
    }
    const xPoint = (xGalactic + galacticOffset) / galacticDivisor;
    return {
      xPoint: xPoint,
      yPoint: yPoint
    };
	}

	planetIsAtZoomLevel(currentZoom) {
		let atZoomLevel = false;
		switch(this.zoom) {
			case 0:
				atZoomLevel = true;
				break;
			case (this.zoom === 1 && currentZoom >= 3): 
				atZoomLevel = true;
				break;
			case (this.zoom === 2 && currentZoom >= 5): 
				atZoomLevel = true;
				break;
			case (this.zoom === 3 && currentZoom >= 6): 
				atZoomLevel = true;
				break;
			default:
				atZoomLevel = false;
		}
		return atZoomLevel;
	}
};

module.exports.Planet = Planet;

class HyperSpaceLane {
	constructor(
		name,
		hyperspaceHash,
		start,
		end,
		startCoordsLngLat,
		endCoordsLngLat,
		length,
		link,
		_start,
		_end,
		coordinates
		) {
		this.name = name || "No Name";
		this.hyperspaceHash = hyperspaceHash;
		this.start = start;
		this.end = end;
		this.startCoordsLngLat = coordinateStringToArray(startCoordsLngLat);
		this.endCoordsLngLat = coordinateStringToArray(endCoordsLngLat);
		this.length = length;
		this.link = link || "No Link";
		this._start = _start;
		this._end = _end;
		this.coordinates = coordinateStringToArray(coordinates);
	}


	// reverseCoordinatesLatLng(coordinatesData) {
	// 	const coordiantes = coordinatesData[0];
	// 	console.log("coordinates array: ", coordiantes);
	// 	const latBefore = coordiantes[0];
	// 	// const coordinatesLatLng = _.map(coordinatesLngLat, function(el) {
	// 	// 	console.log("el: ", el);
	// 	// 	el.reverse();
	// 	// 	return el;
	// 	// });

	// 	for(let k of coordiantes) { 
	// 		k.reverse();
	// 	}
	// 	const latAfter = coordiantes[0];
	// 	console.log("Before and after the same: ", (latBefore === latAfter)? true : false);
	// 	return coordiantes;
	// }


	reverseLatLng(coordinatesData) {
		const latBefore = coordinatesData[0][1];
		for(let k of coordinatesData) {
			console.log("k before: ", k);
			k.reverse();
			console.log("k after: ", k);
		}
		const latAfter = coordinatesData[0][0];
		console.log("Before and after the same: ", (latBefore === latAfter)? true : false);
		return coordinatesData;
	}
};

function coordinateStringToArray(coordinates) {
	if(Array.isArray(coordinates)) {
		return coordinates;
	} else {
		let jsonJumpCoordinates = JSON.parse("[" + coordinates + "]");
		return jsonJumpCoordinates[0];			
	}
};

module.exports.HyperSpaceLane = HyperSpaceLane;

class HyperSpaceNode {
	constructor(system, lng, lat, hyperspaceLanes, nodeId = 0) {
		this.system = system;
		this.lng = lng;
		this.lat = lat;
		this.hyperspaceLanes = hyperspaceLanes;
		this.nodeId = nodeId;
	}
};

module.exports.HyperSpaceNode = HyperSpaceNode;

class Point {
	constructor(coordinates) {
		this.lng = coordinates[0];
		this.lat = coordinates[1];
		this.coordinates = coordinates;

		if(isNaN(this.lng)){
			console.log("lng is not a number: ", this.lng);
		}

		if(isNaN(this.lat)){
			console.log("lat is not a number: ", this.lat);
		}
	}

	locationObject() {
		return {
			lat: this.lat,
			lng: this.lng
		};
	}
};

module.exports.Point = Point;

class NodeDataBuilder {
	constructor() {}

	hashPrecision() {
		const hashPrecisionValue = 22;
		return hashPrecisionValue;
	}

	docIsNull() {
		return (this.doc === null)? true : false;
	}

	locationLngLat() {
		return [this.lng, this.lat];
	}

	setUpLaneLocation(hyperspaceLaneName) {
		this.loc = this.locationLngLat();
		this.hyperspaceLanes = [hyperspaceLaneName];
		this.geoHash = Geohash.encode(this.lat, this.lng, this.hashPrecision());
	}

	createPlanetNode(doc, hyperspaceLaneName, AlphabetCurrent) {
		if(doc.system === null) {
			console.log("this.system is null in createPlanetNode: ", doc.system);
			this.system = AlphabetCurrent.findNodeName();
		} else {
			this.system = doc.system;
		}

		this.lat = doc.lat;
		this.lng = doc.lng;
		this.xGalacticLong =  doc.xGalacticLong;
		this.yGalacticLong =  doc.yGalacticLong;
		this.setUpLaneLocation(hyperspaceLaneName);

		if(this.system === null) {
			console.log("this.system is null in createPlanetNode: ", this.system);
		}
	}

	createEmptySpaceNode(CurrentPoint, hyperspaceLaneName, AlphabetCurrent) {
		this.system = AlphabetCurrent.findNodeName();
		this.lat = CurrentPoint.lat;
		this.lng = CurrentPoint.lng;
		this.xGalacticLong = getGalacticXFromLongitude(this.lng);
		this.yGalacticLong = getGalacticYFromLatitude(this.lat);
		this.setUpLaneLocation(hyperspaceLaneName);


		if(this.system === null) {
			console.log("this.system is null in createEmptySpaceNode: ", this.system);
		}

	}

	addHyperspaceLane(hyperspaceLaneName) {
		const currentHyperspaceLanes = _.clone(this.hyperspaceLanes);
		this.hyperspaceLanes = currentHyperspaceLanes.push(hyperspaceLaneName);
	}

	// createNodeData(CurrentPoint, hyperspaceLaneName, AlphabetCurrent) {
	// 	// console.log("Doc is null: ", this.docIsNull());

	// 	this.lat = CurrentPoint.lat;
	// 	this.lng = CurrentPoint.lng;
	// 	this.loc = this.locationLngLat();

	// 	const hashPrecision = 22;

	// 	if(this.planetExists || this.nodeExists) {
	// 		this.system = this.doc.system;
	// 		this.lat = this.doc.lat;
	// 		this.lng = this.doc.lng;
	// 		this.xGalacticLong =  this.doc.xGalacticLong;
	// 		this.yGalacticLong =  this.doc.yGalacticLong;
	// 		this.loc = this.locationLngLat();
	// 		this.hyperspaceLanes = [hyperspaceLaneName];
	// 		this.geoHash = Geohash.encode(this.lat, this.lng, hashPrecision);
	// 	} else if(this.planetExists && !this.nodeExists) {
	// 		// this.nodeId = genRandFiveDigit();
	// 		this.hyperspaceLanes = [hyperspaceLaneName];
	// 	} else if(!this.planetExists && this.nodeExists) {
	// 		// this.nodeId = this.nodeId;
	// 		this.hyperspaceLanes = this.doc.hyperspaceLanes.concat([hyperspaceLaneName]);
	// 	} else if(!this.planetExists && !this.nodeExists) {
	// 		// this.nodeId = genRandFiveDigit();
	// 		this.system = AlphabetCurrent.findNodeName();
	// 		this.lat = CurrentPoint.lat;
	// 		this.lng = CurrentPoint.lng;
	// 		this.xGalacticLong = getGalacticXFromLongitude(this.lng);
	// 		this.yGalacticLong = getGalacticYFromLatitude(this.lat);
	// 		this.loc = this.locationLngLat();
	// 		this.hyperspaceLanes = [hyperspaceLaneName];
	// 		this.geoHash = Geohash.encode(this.lat, this.lng, hashPrecision);
	// 	}


		// Node Data
		// { _id: 5a790632c0fbe900456f3668,
		//   system: 'Foxtrot Thesh',
		//   loc: [ 71.59469, -21.978631 ],
		//   __v: 0,
		//   nodeId: 56097,
		//   hyperspaceLanes: [ 'Gamma Cherek 1' ],
		//   xGalacticLong: 7969.884135077762,
		//   yGalacticLong: -2502.6379866982224,
		//   lat: -21.978631,
		//   lng: 71.59469
		// }


		// {
		// 	_id: 5a7907871ac1520043b495de,
		// 	system: 'Korriban',
		// 	region: 'Outer Rim',
		// 	coordinates: 'R5',
		// 	xGalactic: 9254.62,
		// 	yGalactic: 6991.44,
		// 	xGalacticLong: 9254.62308021,
		// 	yGalacticLong: 6991.44061642,
		// 	zoom: 0,
		// 	link: 'http://starwars.wikia.com/wiki/Korriban',
		// 	__v: 0,
		// 	lat: 53.045619,
		// 	lng: 83.135694,
		// 	LngLat: [ 83.135694, 53.045619 ],
		// 	hasLocation: true,
		// 	sector: [ 'Sith Worlds' ] 
		// }


	// }

	// addHyperspaceLane(laneName) {
	// 	this.hyperspaceLane = laneName;
	// }

	nodeDataObject() {

		return {
			system : this.system,
			lat : this.lat,
			lng : this.lng,
			xGalacticLong :  this.xGalacticLong,
			yGalacticLong :  this.yGalacticLong,
			loc : this.locationLngLat(),
			// nodeId: this.nodeId,
			hyperspaceLanes: this.hyperspaceLanes,
			geoHash: this.geoHash
		};
	}
};


function getGalacticYFromLatitude(latitude) {
  return  (-3.07e-19*(latitude**12)) + (-1.823e-18*(latitude**11)) + (4.871543e-15*(latitude**10)) + (4.1565807e-14*(latitude**9)) + (-2.900986202e-11 * (latitude**8)) + (-1.40444283864e-10*(latitude**7)) + (7.9614373223054e-8*(latitude**6)) + (7.32976568692443e-7*(latitude**5)) + (-0.00009825374539548058*(latitude**4)) + (0.005511093818675318*(latitude**3)) + (0.04346753629461727 * (latitude**2)) + (111.30155374684914 * latitude);
}

function getGalacticXFromLongitude(longitude) {
  return (111.3194866138503 * longitude);
}

function genRandFiveDigit() {
  return Math.floor(Math.random()*89999+10000);
}




module.exports.NodeDataBuilder = NodeDataBuilder;


class HyperSpacePath {
	constructor(start, end, length, jumps, nodes, hashValue = '', numberOfJumps = null) {
		this.start = start;
		this.end = end;
		this.length = length;
		this.jumps = jumps;
		this.nodes = nodes;
		this.hashValue = hashValue;
		this.numberOfJumps = numberOfJumps;
	}

	createArrayOfHyperspaceLanes(totalLanesInCollection) {
		const hyperspaceLanesArray = [];
		for(let id of this.jumps) {
			let foundLaneData = _.find(totalLanesInCollection, {_id : id});
			hyperspaceLanesArray.push(foundLaneData);
		}
		return hyperspaceLanesArray;
	}

	createArrayOfHyperspaceNodes(totalNodesInCollection) {
		const hyperspaceNodesArray = [];
		for(let id of this.nodes) {
			let foundNodeData = _.find(totalNodesInCollection, {_id : id});
			hyperspaceNodesArray.push(foundNodeData);
		}
		return hyperspaceNodesArray;
	}

	getReversedHyperLanes(totalLanesInCollection, totalNodesInCollection) {
		let reverseLanesSet = new Set();
		let correctLanesSet = new Set();
		for(let i=0; i < this.jumps.length; i++) {
			const jumpLaneId = this.jumps[i];
			let JumpLane = _.find(totalLanesInCollection, { '_id': jumpLaneId });
			const start = this.nodes[i];
			const end = this.nodes[i + 1];
			if(start !== JumpLane._start) {
				reverseLanesSet.add(JumpLane._id);
				this.jumps[i] = -(JumpLane._id);
			} else {
				correctLanesSet.add(JumpLane._id);
			}
			let intersection = new Set([...reverseLanesSet].filter(x => correctLanesSet.has(x)));
		}
		const reversedLanes = [...reverseLanesSet];
		return reversedLanes;
	}

	generateHashNumber(totalLanesInCollection) {
		let sumOfHashes = '|';
		for(let i=0; i < this.jumps.length; i++) {
			const jumpLaneId = this.jumps[i];
			let JumpLane = _.find(totalLanesInCollection, { '_id': jumpLaneId });
			const jumpLaneHash = JumpLane.hyperspaceHash;
			sumOfHashes += jumpLaneHash + '|';
		}
		const jumpHash = hash(sumOfHashes);
		return jumpHash;
	}

	validateJump(totalLanesInCollection, totalNodesInCollection) {
		if(this.jumps.length + 1 === this.nodes.length) {
			for(let i=0; i < this.jumps.length; i++) {
				const jumpLaneId = this.jumps[i];
				let JumpLane = _.find(totalLanesInCollection, { '_id': jumpLaneId });
				const startId = this.nodes[i];
				let StartNode = _.find(totalNodesInCollection, { 'nodeId': startId });
				const endId = this.nodes[i + 1];
				let EndNode = _.find(totalNodesInCollection, { 'nodeId': endId });
				const jumpStartCoordinates = JumpLane.startCoordsLngLat;
				const jumpEndCoordinates = JumpLane.endCoordsLngLat;
				const firstCoordinates = JumpLane.coordinates[0];
				const secondCoordinates = JumpLane.coordinates[JumpLane.coordinates.length - 1];
				const hyperspacePathIsInvalid = (
					StartNode.system !== JumpLane.start ||
					EndNode.system !== JumpLane.end ||
					!_.isEqual(jumpStartCoordinates, firstCoordinates) ||
					!_.isEqual(jumpEndCoordinates, secondCoordinates)
				);
				if(hyperspacePathIsInvalid) {
					return false;
				}
			}
			return true;
		} else {
			return false;
		}
	}
};

module.exports.HyperSpacePath = HyperSpacePath;

class HyperSpacePathCollection {
	constructor(start, end, lanes, nodes) {
		this.start = start;
		this.end = end;
		this.paths = [];
		this.lanes = lanes;
		this.nodes = nodes;
	}

	linkHyperspacePaths() {
		let laneSet = new Set([...this.lanes]);
		let indexSet = new Set();
  	for(let path of this.paths) {
  		let reversedHyperspaceLanes = path.getReversedHyperLanes(this.lanes, this.nodes);
  		for(let reversedLaneId of reversedHyperspaceLanes) {
  			const index = _.findIndex(this.lanes, {_id: reversedLaneId});
  			indexSet.add(index);
  		}
  	}
		for(let index of indexSet) {
			const JumpLane = this.lanes[index];
			const reversedJumpId = -Math.abs(JumpLane._id);
			const jumpCoordinatesReversed = JumpLane.coordinates.slice().reverse();
			const hyperspaceHash = uuidv4();
			const ReversedHyperspaceLane = new HyperSpaceLane(
				JumpLane.name,
				hyperspaceHash,
				JumpLane.end,
				JumpLane.start,
				JumpLane.endCoordsLngLat,
				JumpLane.startCoordsLngLat,   
				JumpLane.length,
				JumpLane.link,
				JumpLane._end,
				JumpLane._start,
				jumpCoordinatesReversed,
				reversedJumpId
			);
  		this.lanes.push(ReversedHyperspaceLane);
  		const newIndex = _.findIndex(this.lanes, {_id: reversedJumpId});
		}
		this.validateJumps();
	}

	validateJumps() {
		console.log("\n\nValidating all jumps  **************");
		for(let path of this.paths) {
			const pathIsValid = path.validateJump(this.lanes, this.nodes);
			const jumpHashValue = (pathIsValid)? path.generateHashNumber(this.lanes) : '';
			console.log("path is valid: ", pathIsValid);
			path.hashValue = jumpHashValue;
  	}
	}
};

module.exports.HyperSpacePathCollection = HyperSpacePathCollection;