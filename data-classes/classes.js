

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
		link = ''
		)
	{
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
	}



	ObjectInMapView(map, mapWidth, mapHeight, MapBoundaries) {

	    // console.log("mapHeight in ObjectInMapView: ", mapHeight);
	    // console.log("mapWidth in ObjectInMapView: ", mapWidth);

	    const CurrentMapBoundaries = map.getBounds();

	    // console.log("MapBoundaries: ", MapBoundaries);
	    // console.log("stellarObject: ", stellarObject);
	    const mapOffSetLng = 0;
	    const mapOffSetLat = 0;

	    // const inNorthSouthRange = (CurrentMapBoundaries._southWest.lat - mapOffSetLat < stellarObject.latLng.lat && stellarObject.latLng.lat < CurrentMapBoundaries._northEast.lat + mapOffSetLat) ? true : false;
	    // const inEastWestRange = (CurrentMapBoundaries._southWest.lng - mapOffSetLng < stellarObject.latLng.lng && stellarObject.latLng.lng < CurrentMapBoundaries._northEast.lng + mapOffSetLng) ? true : false;

	    const inNorthSouthRange = (MapBoundaries.south < this.lat && this.lat < MapBoundaries.north) ? true : false;
	    const inEastWestRange = (MapBoundaries.west < this.lng && this.lng < MapBoundaries.east) ? true : false;
	    // console.log("inNorthSouthRange: ", inNorthSouthRange);
	    // console.log("inEastWestRange: ", inEastWestRange);
	    // console.log("CurrentMapBoundaries: ", CurrentMapBoundaries);
	    // console.log("stellarObject: ", stellarObject);
	    const objectInvView = (inNorthSouthRange && inEastWestRange) ? true : false;

	    if(objectInvView) {

	        // console.log("inNorthSouthRange: ", inNorthSouthRange);
	        // console.log("inEastWestRange: ", inEastWestRange);

	        // console.log("CurrentMapBoundaries: ", CurrentMapBoundaries);

	        // console.log("MapBoundariesMax: ", MapBoundariesMax);

	        // console.log("In range: ", stellarObject);

	    }

	    return objectInvView;

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
	constructor(name, hyperspaceName, start, end, startCoordsLngLat, endCoordsLngLat, length, link, Start, End) {
		this.name = name;
		this.hyperspaceName = hyperspaceName;
		this.start = start;
		this.end = end;
		this.startCoordsLngLat = startCoordsLngLat;
		this.endCoordsLngLat = endCoordsLngLat;
		this.length = length;
		this.link = link || "No Link";
		this.Start = Start;
		this.End = End;
	}
};

module.exports.HyperSpaceLane = HyperSpaceLane;