var fs = require("fs");
var util = require("util");
var path = require("path");

if(process.argc < 5){
	throw new Error("Please specify [CMD] [YEAR] [FORM] {IGNORE yes/no}");
}

var cmd = process.argv[2];
var year = process.argv[3];
var form = process.argv[4];
var ignore = process.argv[5];

function fixFileJSON(buff){
	return "{ " + buff.slice(0, buff.lastIndexOf(",")) + " }";
}

var fieldDumpJS = JSON.parse(fixFileJSON(fs.readFileSync(year + "/field_dump/" + form + ".pjson").toString()));
var transfJS = JSON.parse(fs.readFileSync(year + "/transform/" + form + ".json"));
var definitionJS = JSON.parse(fs.readFileSync(year + "/definition/" + form + ".json"));
var supportedJS = JSON.parse(fs.readFileSync(year + "/supported.json"));

result = [];

if(cmd == "dmp_trans"){
/*
 * Check FIELD DUMP file with Transform file
 * */	
	function checkDmpTransform(type, data1, data2){
		firstLoop:
		for(var e in data1){
			for(var r in data2){
				if((ignore == "yes" && e == r) || (data1[e].fdf == data2[r].fdf)){
					continue firstLoop;
				}
			}
			result.push(type + " not found", e, data1[e]);
		}
	}

	checkDmpTransform("transform", fieldDumpJS, transfJS.fields);
	checkDmpTransform("field_dump", transfJS.fields, fieldDumpJS);

}else if(cmd == "def_trans"){
/*
 * Check Definition file with Transform file
 * */
	Object.prototype.size = function () {
		var len = this.length ? --this.length : -1;
		for (var k in this)
			len++;
		return len;
	}

	//Levenshtein distance
	function distanceLevenshtein (a, b){
		if(a.length == 0) return b.length; 
		if(b.length == 0) return a.length; 

		var matr = [];//Matrix
		for(var i = 0; i <= b.length; i++){
			matr[i] = [i];
		}

		for(var j = 0; j <= a.length; j++){
			matr[0][j] = j;
		}

		for(var i = 1; i <= b.length; i++){
			for(var j = 1; j <= a.length; j++){
				if(b.charAt(i-1) == a.charAt(j-1)){
					matr[i][j] = matr[i-1][j-1];
				} else {
					matr[i][j] = Math.min(matr[i-1][j-1] + 1, // substitution
					Math.min(matr[i][j-1] + 1, // insertion
					matr[i-1][j] + 1)); // deletion
				}
			}
		}

		return matr[b.length][a.length];
	};

	function checkDefTransform(type, data1, data2, ignoreCheck, data3){
		firstLoop:
		for(var e in data1.fields){
			if(e in supportedJS.commonFields){
				continue;
			}
			var compare = null;
			var found = false;
			var arrayProblem = false;
			for(var r in data2.fields){
				if(ignoreCheck === true && e in data3){
					continue firstLoop;
				}
				//look most similar word
				if(e == "L24a" && r == "L24a_no"){
			             var asdas=1;	
				}

				if(compare === null || (distanceLevenshtein(e, r) < distanceLevenshtein(e, compare) && (r.indexOf(e) == 0 || e.indexOf(r) == 0))){//could be better
					compare = r;
				}
			}

			if(compare.indexOf(e) == 0 || e.indexOf(compare) == 0){
				found = true;
				var existsChoiceArray = data1.fields[e] == "ChoiceArray";
				var existsOptions = data2.fields[compare].options && data2.fields[compare].options.size() > 1;
				if((existsOptions || existsChoiceArray) && (!existsOptions || !existsChoiceArray)){
					arrayProblem = true;
				}
			}

			if(found == false ){
				result.push([type + " not found", e, data1.fields[e]]);
			}
			if(arrayProblem == true){
				result.push([type + " array problem", e, data1.fields[e]]);
			}
		}
	}

	checkDefTransform("definition", transfJS, definitionJS, ignore == "yes", fieldDumpJS);
	checkDefTransform("transform", definitionJS, transfJS);
}else{
	throw new Error("Command not defined: " + cmd);
}

var stream = fs.createWriteStream("/tmp/checkdiff-"+ new Date().getTime() +".txt", {flags: 'w'});
//console.error(JSON.stringify(result));
stream.write(JSON.stringify(process.argv,null,4) + "\n");
stream.write(JSON.stringify(result,null,4));
//console.error((result));
