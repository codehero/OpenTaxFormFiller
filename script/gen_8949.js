var util = require("util");
var fs = require("fs");

if(process.argv.length < 4){
	util.debug(
		"Invocation:\n" +
		"node SCRIPT INPUT.JSON OUTPUT_PREFIX\n" +
		"output is to one or more files with OUTPUT_PREFIX");
	process.exit(1);
}

var filePrefix = process.argv[3];

function dateIntToStr(d){
	var year = Math.floor(d / 10000);
	var month = Math.floor((d % 10000) / 100);
	var day = d % 100;
	return month + "/" + day +"/"+ year;
}

function appendOutput(type, line, data, output){
	var count = 0;
	var section = (line == 1) ? "PartI" : "PartII";
	if(section in data){
		if(type in data[section]){
			output["C" + line + type] = "Yes";
			var arr = data[section][type];
			var e_total = 0;
			var f_total = 0;
			var g_total = 0;
			for(var i = 0; i < arr.length; ++i){
				var prefix = line + "." + (i + 1);

				/* Truncate to 34 letts output so it fits */
				output[prefix + "a"] = arr[i][0].substr(0, 34);

				if(arr[i][3]){
					/* Expect integer is in YYYYMMDD format. */
					output[prefix + "c"] = dateIntToStr(arr[i][3]);
				}

				output[prefix + "d"] = dateIntToStr(arr[i][2]);

				output[prefix + "e"] = arr[i][4].toFixed(2);
				output[prefix + "f"] = arr[i][5].toFixed(2);

				e_total += arr[i][4];
				f_total += arr[i][5];
			}
			count += arr.length;

			/* Assign total.s */
			output["L"+ (line + 1) +"e"] = e_total.toFixed(2);
			output["L"+ (line + 1) +"f"] = f_total.toFixed(2);
		}
	}

	return count;
}

var data = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

/* Produce a form for Part A items. */
var count = 0;
var output = {};
count += appendOutput("A", 1, data, output);
count += appendOutput("A", 3, data, output);

if(count){
	fs.writeFileSync(filePrefix + "_A.json", JSON.stringify(output), "utf8");
}

var count2 = 0;
var output2 = {};

count2 += appendOutput("B", 1, data, output2);
count2 += appendOutput("B", 3, data, output2);

if(count2){
	fs.writeFileSync(filePrefix + "_B.json", JSON.stringify(output2), "utf8");
}
