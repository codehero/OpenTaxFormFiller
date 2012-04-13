var fs = require("fs");
var util = require("util");

/* Accept line prefix parameter. */
var prefix = "L";
if(process.argv[3])
	prefix = process.argv[3];

fs.readFile(process.argv[2], "utf8", function(err, data){
	if(err)
		throw err;

	var lineMap = {
	};

	var lines = data.split("\n");
	lines.forEach(function(line){
		/* Skip blank lines or lines without 'L' at beginning. */
		if(!line.length || line.charAt(0) != prefix.charAt(0))
			return;

		/* Make sure there is an '=' sign */
		if(line.indexOf("=") == -1)
			return;

		var parts = line.split("=");
		var id = parts[0].trim().substr(1);
		var num = parseInt(id, 10);
		/* Skip any field not containing a number after 'L' */
		if(isNaN(num))
			return;

		/* Not sure if I need this now, holding onto it
		var digitCount = 0;
		if(num > 99)
			++digitCount;
		if(num > 9)
			++digitCount;
		if(num >= 0)
			++digitCount;
		var modifier = id.substr(digitCount); */

		var value = parts[1].trim();

		/* Strip out any tabbed annotations. */
		value = value.split("\t")[0];

		lineMap["L" + id] = value;
	});

	util.puts(JSON.stringify(lineMap));
});
