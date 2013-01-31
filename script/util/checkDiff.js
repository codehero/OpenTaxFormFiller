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
	function checkDmpTransform(type, data1, data2){ //dont work very well, use DTF, TF or FT
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

	function checkDefTransform(type, data1, data2, isDef, ignoreCheck, data3){//dont work very well, use DTF, TF or FT
		firstLoop:
		for(var e in data1.fields){
			if(e in supportedJS.commonFields){
				continue;
			}
			var found = false;
			var arrayProblem = false;
			for(var r in data2.fields){
				if(ignoreCheck === true && e in data3){
					continue firstLoop;
				}
				if(data2.fields[r].found == true){
					continue;
				}
				if((isDef == true && r.indexOf(e) == 0) || (isDef == false && e.indexOf(r) == 0)){
					found = true;
					data2.fields[r].found = true;
					var existsChoiceArray = data1.fields[e] == "ChoiceArray";
					var existsOptions = data2.fields[r].options && data2.fields[r].options.size() > 1;
					if((existsOptions || existsChoiceArray) && (!existsOptions || !existsChoiceArray)){
						arrayProblem = true;
					}
					break;
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

	checkDefTransform("definition", transfJS, definitionJS, false, ignore == "yes", fieldDumpJS);
	checkDefTransform("transform", definitionJS, transfJS, true);
}else if(cmd == "DTF"){ //Order to check: Definition > Transform > FieldDump
	for(var def in definitionJS.fields){
		firstLoop:
		if(def in supportedJS.commonFields){
			continue;
		}
		var transFounds = [];
		var dmpNotFounds = [];
		for(var transf in transfJS.fields){
			if(ignore == "yes" && transf in fieldDumpJS){
				continue;
			}
			if(transf.indexOf(def) == 0 && transfJS.fields[transf].used != true){
				transFounds.push(transf);

				transfJS.fields[transf].found = false;
				for(var fieldDump in fieldDumpJS){
					if((ignore == "yes" && fieldDump == transf) || fieldDumpJS[fieldDump].fdf == transfJS.fields[transf].fdf){
						transfJS.fields[transf].found = true;
						break;
					}
				}

				if(transfJS.fields[transf].found == false){
					dmpNotFounds.push(transf);
				}

				transfJS.fields[transf].used = true;
				if(definitionJS.fields[def] != "ChoiceArray"){
					break;	
				}
			}
		}

		//if(def == "L24a"){
		//	result.push(definitionJS.fields[def], transFounds);
		//}

		if(transFounds.length == 0){
			//No encotro trasnform
			result.push("Definition not found: " + def, definitionJS.fields[def]);
		}
		if(definitionJS.fields[def] == "ChoiceArray" && transFounds.length < 2){
			//No encontro opciones
			result.push("Definition " + def + " ChoiceArray found only " + transFounds.length + " options", definitionJS.fields[def], transFounds);
		}
		for(var i=0; i < dmpNotFounds.length; i++){
			//No encontro dumps
			result.push("Definition " + def + " not found dumpfield for " + dmpNotFounds[i] + " transform", transfJS.fields[dmpNotFounds[i]]);
		}

	}	
}else if(cmd == "FT"){ //Order to check: FieldDump > Transform
	for(var fieldDump in fieldDumpJS){
		fieldDumpJS[fieldDump].exists = [];
		for(var transf in transfJS.fields){
			if(fieldDump == transf){
				fieldDumpJS[fieldDump].sameName = true;;
			}
			if(transfJS.fields[transf].fdf == fieldDumpJS[fieldDump].fdf){
				fieldDumpJS[fieldDump].exists.push(transf);
			}
		}
		if(fieldDumpJS[fieldDump].exists.length > 1){
			result.push(fieldDump + " have more than 1 transform", fieldDumpJS[fieldDump].exists);
		}else if(fieldDumpJS[fieldDump].exists.length == 0){
			result.push(fieldDump + " transform not found");
		}

		if(fieldDumpJS[fieldDump].sameName == true){
			result.push(fieldDump + " exists transform with the same name");
		}
	}

}else if(cmd == "TF"){ //Order to check: Transform > FieldDump
	for(var transf in transfJS.fields){
		transfJS.fields[transf].exists = [];
		for(var fieldDump in fieldDumpJS){
			if(transfJS.fields[transf].fdf == fieldDumpJS[fieldDump].fdf){
				transfJS.fields[transf].exists.push(fieldDump);
			}
		}
		if(transfJS.fields[transf].exists.length > 1){
			result.push(transf + " have more than 1 fieldDump", transfJS.fields[transf].exists);
		}else if(transfJS.fields[transf].exists.length == 0){
			result.push(transf + " fieldDump not found");
		}
	}
}else if(cmd == "MKTRANSFORM"){ //Generate transform from Definition and FieldDump
	if(definitionJS.fields.length != fieldDumpJS.length){
		throw new Error("Definition file and field dump file dont have the same size: " + cmd);
	}
	var i=0;
	var defKeys = Object.keys(definitionJS.fields);
	for(var fieldDump in fieldDumpJS){
		transfJS.fields[defKeys[i]] = {};
		transfJS.fields[defKeys[i]] = fieldDumpJS[fieldDump];
		i++;
	}
	var fname = "/tmp/newTranform-"+ new Date().getTime() +".txt";
	var stream = fs.createWriteStream(fname, {flags: 'w'});
	stream.write(JSON.stringify(process.argv,null,4) + "\n");
	stream.write(JSON.stringify(transfJS,null,4) + "\n");

}else if(cmd == "MKDEF"){ //Generate defrinition from  FieldDump
	function fixFDFname(fdfStr){
		var hash = {
			" " : "_" ,
			"(" : ""  , 
			")" : ""  ,
			"'" : "_" ,
			"." : "_" ,
			"\," : "_" 
		};

		return fdfStr
			.replace( /[ ()'.]/g , function ( $0 ) {
				return hash[ $0 ];
			})
			.replace( /__/g , "_" )
			;
	}
	for(var fieldDump in fieldDumpJS){
		definitionJS.fields[ fixFDFname( fieldDumpJS[ fieldDump ].fdf) ] = "Text";
	}
	var fname = "/tmp/newDefinition-" + new Date().getTime() + ".txt" ;
	var stream = fs.createWriteStream( fname, { flags : 'w'} ) ;
	stream.write( JSON.stringify( process.argv, null, 4 ) + "\n" );
	stream.write( JSON.stringify( definitionJS, null, 4 ) + "\n" );

}else{
	throw new Error("Command not defined: " + cmd);
}

var fname = "/tmp/checkdiff-"+ new Date().getTime() +".txt";
var stream = fs.createWriteStream(fname, {flags: 'w'});
stream.write(JSON.stringify(process.argv,null,4) + "\n");
stream.write(JSON.stringify(result,null,4));
console.error(fname + ": " + process.argv.join(" "));
