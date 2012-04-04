var fs = require("fs");
var util = require("util");

var RECORD_INIT = "---";
var SPLITTER = ": ";

var g_keep_values = true;

var COMMANDS = {
	"genIds" : function(fields){
		if(process.argv.length < 5)
			throw new Error("Please specify an output file for the pjson!");
		var output2 = [];
		var arr =  [
			"%FDF-1.2",
			"1 0 obj<</FDF<< /Fields["
		];
		var prefix = "F";
		var counter = 0;
		fields.forEach(function(f){
			if("Text" == f.type){
				var id = prefix + counter.toString(16);
				arr.push("<</T("+ f.name +")/V("+ id +")>>");
				output2.push("\""+ id +"\":{\n\"fdf\":\""+ f.name +
					"\",\n\"type\":\"text\"\n},");
			}
			++counter;
		});

		var TRAILER = [
			"] >> >>",
			"endobj",
			"trailer",
			"<</Root 1 0 R>>",
			"%%EOF",
			""
		];

		arr = arr.concat(TRAILER);

		fs.writeFileSync(process.argv[4], output2.join("\n"), "utf8");

		util.puts(arr.join("\n"));
	},

	"jsonify" : function(fields){
		util.puts(JSON.stringify(fields));
	}
};


if(process.argv.length < 4)
	throw new Error("Please specify FDF PDF file and a command");

var g_cmd = process.argv[3];
if(!(g_cmd in COMMANDS))
	throw new Error("Invalid command " + g_cmd);

fs.readFile(process.argv[2], "utf8", function(err, data){
	if(err)
		throw err;

	var fields = [];
	function flushField(f){
		if(f){
			/* Skip over blank types. */
			if(!f.type)
				return;

			/* Skip over already populated fields if desired. */
			if(("value" in f) && g_keep_values)
				return;

			fields.push(f);
		}
	}

	/* Note that "---" */
	var curField = null;
	var lines = data.split("\n");
	lines.forEach(function(line){
		if(line == RECORD_INIT){
			flushField(curField);
			curField = {};
		}
		else if(line.length){
			var idx = line.indexOf(SPLITTER);
			if(-1 == idx){
				throw new Error("Invalid line: " + line);
			}
			var t = line.substr(0, idx);
			var val = line.substr(idx + 2);
			switch(t){
				case "FieldType":
					curField.type = val;
					break;

				case "FieldName":
					curField.name = val;
					break;

				case "FieldMaxLength":
					curField.maxLength = parseInt(val, 10);
					break;

				case "FieldValue":
					curField.value = val;
					break;

				case "FieldValueDefault":
					curField.valueDefault = val;
					break;

				case "FieldStateOption":
					if(!("options" in curField))
						curField.options = [];
					curField.options.push(val);
					break;
			}
		}
	});


	flushField(curField);

	COMMANDS[g_cmd](fields);
});
