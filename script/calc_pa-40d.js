var util = require("util");
var fs = require("fs");

if(process.argv.length < 3){
	util.debug(
		"Invocation:\n" +
		"node SCRIPT INPUT.JSON\n" +
		"output is to stdout");
	process.exit(1);
}

var inputData = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

var defaults = {
	"L3" : 0,
	"L4_Total" : 0,
	"L4_Basis" : 0,
	"L5" : 0,
	"L6" : 0,
	"L7" : 0,
	"L8" : 0,
	"L9" : 0,
	"L10" : 0
};

/* Set default values. */
for(x in defaults){
	if(!(x in inputData))
		inputData[x] = defaults[x];
}



inputData.L2 = 0;

for(var i = 1; i <= 19; ++i){
	var sold_id = "L1_" + i + "d";
	var bought_id = "L1_" + i + "e";
	if(sold_id in inputData){
		 if(!(bought_id in inputData))
			throw new Error("Missing bought row for L1_d" + i);
		var fid = "L1_" + i + "f";
		inputData[fid] = inputData[sold_id] - inputData[bought_id];
		if(inputData[fid] < 0)
			inputData["L1_" + i + "_Loss"] = "yes";
		inputData.L2 += inputData[fid];
	}
	else if(bought_id in inputData){
		throw new Error("Missing sold row for L1_e" + i);
	}
}

inputData.L4 = inputData.L4_Total - inputData.L4_Basis;

if(inputData.L2 < 0)
	inputData.L2_Loss = "yes";
if(inputData.L5 < 0)
	inputData.L5_Loss = "yes";
if(inputData.L6 < 0)
	inputData.L6_Loss = "yes";

inputData.L11 = 0;

for(var i = 2; i <= 10; ++i)
	inputData.L11 += inputData["L" + i];

if(inputData.L11 < 0)
	inputData.L11_Loss = "yes";

util.puts(JSON.stringify(inputData));
