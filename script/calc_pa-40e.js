var util = require("util");
var fs = require("fs");

/* Shamelessly whiteboxed from f1040se */

util.debug("WARNING, not taking into account royalty income on L2!");

if(process.argv.length < 3){
	util.debug(
		"Invocation:\n" +
		"node SCRIPT INPUT.JSON\n" +
		"output is to stdout");
	process.exit(1);
}

var inputData = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

var defaults = {
	"L1A" : 0,
	"L2A" : 0,
	"L21" : 0,
	"L20" : 0,
};
/* Set default values. */
for(x in defaults){
	if(!(x in inputData))
		inputData[x] = defaults[x];
}

var totals = {
	"A" : 0,
	"B" : 0,
	"C" : 0
};

for(col in totals){
	for(var i = 3; i <= 16; ++i){
		var id = "L" + i + col;
		if(id in inputData){
			totals[col] += inputData[id];
		}
	}
}

/* TODO add other expenses */

for(col in totals){
	/* If no expenses or income skip it. */
	if(!totals[col] && !inputData["L1" + col])
		continue;

	inputData["L18" + col] = totals[col];
	inputData["L19" + col] = inputData["L1" + col] - totals[col];
	inputData["L20" + col] = totals[col] - inputData["L1" + col] ;
	if(inputData["L20" + col] > 0)
		inputData["L20" + col + "_Loss"] = "yes";
}

inputData.L21 = 0;

for(col in totals){
	var id = "L19" + col;
	if((id in inputData) && inputData[id] > 0)
		inputData.L21 += inputData[id];
}

inputData.L23 = inputData.L21 + inputData.L22;

/* Output augmented data to stdout. */
util.puts(JSON.stringify(inputData));
