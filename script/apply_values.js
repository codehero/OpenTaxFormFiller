var util = require("util");
var fs = require("fs");

if(process.argv.length < 5){
	util.debug(
		"Invocation:\n" +
		"node SCRIPT DEFINITION_FILE TRANSFORM_FILE DATA_FILE\n" +
		"output is in FDF format to stdout\n");
	process.exit(1);
}

var definition = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var transform = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
var data = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));

function composeTextField(id, value){
	return "<</T("+ id +")/V("+ value +")>>";
}

var output =  [
	"%FDF-1.2",
	"1 0 obj<</FDF<< /Fields["
];

for(lineID in data){
	var type = definition.fields[lineID];
	var v = data[lineID];
	var xform = transform.fields[lineID];
	switch(type){
		case "Integer":
			/* FIXME tailing decimal point and numbers not caught here! */
			var i = parseInt(v, 10);
			if(isNaN(i))
				throw new Error(lineID +" is not an integer!");
			output.push(composeTextField(xform.fdf, v));
			break;

		case "Percent":
			var i = parseFloat(v);
			if(isNaN(i))
				throw new Error(lineID +" is not a percent!");
			if(i > 100 || i < 0)
				throw new Error(lineID +" is an invalid percent value!");
			output.push(composeTextField(xform.fdf, v));
			break;

		case "Number":
			var i = parseFloat(v);
			if(isNaN(i))
				throw new Error(lineID +" is not a percent!");
			output.push(composeTextField(xform.fdf, v));
			break;

		case "Amount":
			var i = parseFloat(v);
			if(isNaN(i))
				throw new Error(lineID +" is not a valid dollar amount!");
			/* Split amount into dollars and cents. */
			var d = Math.floor(i);
			var c = Math.round(i * 100) % 100 + "";
			if(c.length < 2)
				c = "0" + c;
			output.push(composeTextField(transform.fields[lineID + "_D"].fdf, d));
			output.push(composeTextField(transform.fields[lineID + "_C"].fdf, c));
			break;

		case "Text":
			output.push(composeTextField(xform.fdf, v));
			break;

		case "Choice":
			if(!(v in xform.options))
				throw new Error(v +" is an invalid choice for " + lineID + "!");

			output.push(composeTextField(xform.fdf, xform.options[v]));
			break;
	}
}

var TRAILER = [
	"] >> >>",
	"endobj",
	"trailer",
	"<</Root 1 0 R>>",
	"%%EOF",
	""
];

output = output.concat(TRAILER);
util.puts(output.join("\n"));
