

class Planet {
	constructor(systemValue, sectorValue, regionValue, coordinatesValue, xGalactic = 0, yGalactic = 0, xGalacticLong = 0, yGalacticLong = 0, hasLocation = false, LngLat = [], zoom = 5, link = '') {
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
		this.zoom = zoom;
		this.link = link;
	}
};

module.exports.Planet = Planet;



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
};

module.exports.HyperSpaceLane = HyperSpaceLane;