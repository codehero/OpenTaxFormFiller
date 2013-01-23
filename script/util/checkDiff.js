var fs = require("fs");
var util = require("util");
var path = require("path");

if(process.argc < 5){
	throw new Error("Please specify [fieldump] [transform]");
}

var cmd = process.argv[2];

function fixFileJSON(buff){
	return "{ " + buff.slice(0, buff.lastIndexOf(",")) + " }";
}

Object.prototype.size = function () {
	var len = this.length ? --this.length : -1;
	for (var k in this)
		len++;
	return len;
}


var pjson = JSON.parse(cmd == "dump_transform" ? fixFileJSON(fs.readFileSync(process.argv[3]).toString()) : fs.readFileSync(process.argv[3]));
var transf = JSON.parse(fs.readFileSync(process.argv[4]));

result = [];

if(cmd == "dump_transform"){
for(var e in pjson){
	var found = false;
	for(var r in transf.fields){
		if(pjson[e].fdf.toString() == transf.fields[r].fdf.toString() ){
			found = true;
			break;
		}
	}
	if(found == false  /*&& pjson[e].type in ["text","checkbox"]*/ ){
		result.push("field_dump",e, pjson[e]);
	}
}

for(var e in transf.fields){
	var found = false;
	for(var r in pjson){
		if(pjson[r].fdf == transf.fields[e].fdf){
			found = true;
			break;
		}
	}
	if(found == false /*&& transf.fields[e].type in ["text","checkbox"]*/ ){
		result.push("transform",e, transf.fields[e]);
	}
}
}else if(cmd == "definition_transform"){
	for(var e in pjson.fields){
		var found = false;
		var isArray = 0;
		for(var r in transf.fields){
			if(r.indexOf(e)>-1){
				found = true;
				if(pjson.fields[e] == "ChoiseArray"){
					isArray = 1;
					if(transf.fields[r].options && transf.fields[r].options.size() > 1){
						isArray = 2;
					}
				}
				break;
			}
		}
		if(found == false || isArray == 1){
			result.push("definition",e,pjson.fields[e], {"array" : isArray});
		}
	}
	for(var e in transf.fields){
		var found = false;
		var isArray = 0;
		for(var r in pjson.fields){
			if(e.indexOf(r)>-1){
				found = true;
				if(transf.fields[e].options && transf.fields[e].options.size() > 0){
					isArray = 1;
					if(pjson.fields[r] == "ChoiseArray"){
						isArray = 2;
					}
				}
				break;
			}
		}
		if(found == false || isArray == 1){
			result.push("transform",e,transf.fields[e], {"array" : isArray});
		}
	}
}

//console.error(JSON.stringify(result));
console.error((result));
