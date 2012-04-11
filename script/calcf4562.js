var util = require("util");
var fs = require("fs");

if(process.argv.length < 3){
	util.debug(
		"Invocation:\n" +
		"node SCRIPT INPUT.JSON\n" +
		"output is to stdout");
	process.exit(1);
}

var defaults = {
	/* Part I. */
	"L1" : 500000.00,
	"L2" : 0,
	"L3" : 2000000.00,
	"L6_1c" : 0,
	"L6_2c" : 0,
	"L10" : 0,
	"L11" : 0,

	/* Part II. */
	"L14" : 0,
	"L15" : 0,
	"L16" : 0,
	"L17" : 0,

	/* Part III. */
	"L19a_g" : 0,
	"L19b_g" : 0,
	"L19c_g" : 0,
	"L19d_g" : 0,
	"L19e_g" : 0,
	"L19f_g" : 0,
	"L19g_g" : 0,
	"L19h_g" : 0,
	"L19i_g" : 0,

	"L20a_g" : 0,
	"L20b_g" : 0,
	"L20c_g" : 0,

	/* Part IV. */
	"L23" : 0,

	/* Part V, Section A. */
	"L26_1h" : 0,
	"L26_2h" : 0,
	"L26_3h" : 0,
	"L27_1h" : 0,
	"L27_2h" : 0,
	"L27_3h" : 0,
	"L26_1i" : 0,
	"L26_2i" : 0,
	"L26_3i" : 0,

	/* Part V, Section B. */
	"L30a" : 0,
	"L31a" : 0,
	"L32a" : 0

};

var inputData = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

/* Set default values. */
for(x in defaults){
	if(!(x in inputData))
		inputData[x] = defaults[x];
}

/* Part V */


inputData.L28 = 0;
inputData.L29 = 0;
for(var i = 1; i <= 3; ++i){
	var L26 = "L26_"+ i;
	var L27 = "L27_"+ i;

	if((L26 + "a") in inputData){
		inputData[L26 + "e"] = inputData[L26 + "c"] / 100.0 * inputData[L26 + "d"];

		/* Special case: if user specified a null entry for column i, then user
		 * wants to use ENTIRE Business basis for Section 179 expense. */
		if(null == inputData[L26 + "i"]){
			inputData[L26 + "i"] = inputData[L26 + "e"];
		}

	}

	inputData.L28 += inputData[L26 + "h"] + inputData[L27 + "h"];
	inputData.L29 += inputData[L26 + "i"];
}

/* TODO L3x b-f */
inputData.L33a = inputData.L30a + inputData.L31a + inputData.L32a;

/* Part I */

inputData.L4 = inputData.L2 - inputData.L3;
if(inputData.L4 < 0)
	inputData.L4 = 0;

inputData.L5 = inputData.L1 - inputData.L4;
if(inputData.L5 < 0)
	inputData.L5 = 0;


inputData.L7 = inputData.L29;
inputData.L2 += inputData.L29;

inputData.L8 = inputData.L6_1c + inputData.L6_2c + inputData.L7;

inputData.L9 = (inputData.L8 < inputData.L5) ?
	inputData.L8 : inputData.L5;

var tmp = inputData.L9 + inputData.L10;
if(tmp > inputData.L11)
	tmp = inputData.L11;
inputData.L12 = tmp;

inputData.L13 = inputData.L9 + inputData.L10 - inputData.L12;

/* Part IV. */

inputData.L21 = inputData.L28;

/* TODO include Part III */
inputData.L22 = inputData.L12 +
	+ inputData.L14 + inputData.L15 + inputData.L16 + inputData.L17
	+ inputData.L21;

util.puts(JSON.stringify(inputData));
