

const hyperspaceNodeNameArray = [];
const hyperspaceLaneNameArray = [];
let hyperspaceLaneNamePosition = 0;
let hyperspaceNodeNamePosition = 0;


const AurebeshAlphabet = [
	"Aurek",
	"Besh",
	"Cresh",
	"Dorn",
	"Esk",
	"Forn",
	"Grek",
	"Herf",
	"Isk",
	"Jenth",
	"Krill",
	"Leth",	
	"Mern",	
	"Nern",	
	"Osk",
	"Peth",	
	"Qek",
	"Resh",	
	"Senth",	
	"Trill",	
	"Usk",	
	"Vev",	
	"Wesk",	
	"Xesh",
	"Yirt",
	"Zerek",
	"Cherek",
	"Enth",
	"Onith",
	"Krenth",
	"Nen",
	"Orenth",
	"Shen",
	"Thesh"
];


const GreekAlphabet = [
	"alpha",	
	"beta",	
	"gamma",
	"delta",
	"epsilon",
	"zeta",
	"eta",
	"theta",
	"iota",
	"kappa",
	"lambda",
	"mu",
	"nu",
	"xi",
	"omicron",
	"pi",
	"rho",
	"sigma",
	"tau",
	"upsilon",
	"phi",
	"chi",
	"psi",
	"omega"
];


const HyperspaceLaneNames = [
	"Hyperroute",
	"Spacelane",
	"Jump Route",
	"Hyperway"
];


const MilitaryAlphabet = [
	"Alice",
	"Bravo",
	"Charlie",
	"Desert",
	"Echo",
	"Foxtrot",
	"Golf",
	"Hotel",
	"India",
	"Juliett",
	"Kilo",
	"Lima",
	"Mike",
	"November",
	"Oscar",
	"Papa",
	"Quebec",
	"Romeo",
	"Sierra",
	"Tango",
	"Uniform",
	"Victor",
	"Whiskey",
	"X-ray",
	"Yankee",
	"Zulu"
];


const Alphabets = {
	HyperspaceNames: HyperspaceLaneNames,
	Greek: GreekAlphabet,
	Aurebesh: AurebeshAlphabet,
	Military: MilitaryAlphabet
};



function generateRandomNodeName() {

	for(let nodeNamePrefix of Alphabets.Military) {

		for(let nodeNameSuffix of Alphabets.Aurebesh) {

			const nodeName = nodeNamePrefix + " " + nodeNameSuffix;

			hyperspaceNodeNameArray.push(nodeName);

		}
	}
};

function generateRandomLaneName() {

	for(let laneNamePrefix of Alphabets.HyperspaceNames) {

		laneNamePrefix = capitalizeFirstLetter(laneNamePrefix);

		for(let laneNameSuffix of Alphabets.Aurebesh) {

			for(let endNumber=1; endNumber < 6; endNumber++) {

				const laneName = laneNamePrefix + " " + laneNameSuffix + " " + endNumber;
				hyperspaceLaneNameArray.push(laneName);

			}

		}
	}
};


function findNodeName() {

	hyperspaceNodeNamePosition++;
	return hyperspaceNodeNameArray[hyperspaceNodeNamePosition - 1];

}

function backOneNodeName() {

	hyperspaceNodeNamePosition--;
}



function findLaneName() {

	hyperspaceLaneNamePosition++;
	return hyperspaceLaneNameArray[hyperspaceLaneNamePosition - 1];

}

const NodeNames = generateRandomNodeName();
const LaneNames = generateRandomLaneName();


module.exports = {
	HyperspaceNames: HyperspaceLaneNames,
	Greek: GreekAlphabet,
	Aurebesh: AurebeshAlphabet,
	Military: MilitaryAlphabet,
	NodeNames: NodeNames,
	LaneNames: LaneNames,
	findNodeName: findNodeName,
	findLaneName: findLaneName,
	backOneNodeName: backOneNodeName
};



function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}