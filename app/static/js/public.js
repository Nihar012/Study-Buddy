document.getElementById("inputForm").onload = subjects();
// document.getElementById("questionsOutput").onload = createSyllabusData();createQpaperData();generateQuestions();

function subjects(){
    fetch("/public/subjects").then(function(response){
        response.json().then(function(data){
            let optionHTML = "";
            for (let sub of data.subjects){
                optionHTML += '<option value="' + sub.name + '">' + sub.name + '</option>';
            }
			document.getElementById("subjects").innerHTML = optionHTML;			
        });
    });
}

document.getElementById("subjects").onchange = function (){
	subject = document.getElementById("subjects").value;
	fetch("/public/qpapers/"+ subject).then(function(response){
		response.json().then(function(data){
			let optionHTML = "";
			for (let qpaper of data.qpapers){
				optionHTML += '<option value="' + qpaper.id + '">' + qpaper.name + '</option>';
			}
			document.getElementById("qpapers").innerHTML = optionHTML;
		});
	});
}


var stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now'];

var stemmer = (function(){
	var step2list = {
			"ational" : "ate",
			"tional" : "tion",
			"enci" : "ence",
			"anci" : "ance",
			"izer" : "ize",
			"bli" : "ble",
			"alli" : "al",
			"entli" : "ent",
			"eli" : "e",
			"ousli" : "ous",
			"ization" : "ize",
			"ation" : "ate",
			"ator" : "ate",
			"alism" : "al",
			"iveness" : "ive",
			"fulness" : "ful",
			"ousness" : "ous",
			"aliti" : "al",
			"iviti" : "ive",
			"biliti" : "ble",
			"logi" : "log"
		},

		step3list = {
			"icate" : "ic",
			"ative" : "",
			"alize" : "al",
			"iciti" : "ic",
			"ical" : "ic",
			"ful" : "",
			"ness" : ""
		},

		c = "[^aeiou]",          // consonant
		v = "[aeiouy]",          // vowel
		C = c + "[^aeiouy]*",    // consonant sequence
		V = v + "[aeiou]*",      // vowel sequence

		mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
		meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
		mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
		s_v = "^(" + C + ")?" + v;                   // vowel in stem

	return function (w) {
		var 	stem,
			suffix,
			firstch,
			re,
			re2,
			re3,
			re4,
			origword = w;

		if (w.length < 3) { return w; }

		firstch = w.substr(0,1);
		if (firstch == "y") {
			w = firstch.toUpperCase() + w.substr(1);
		}

		// Step 1a
		re = /^(.+?)(ss|i)es$/;
		re2 = /^(.+?)([^s])s$/;

		if (re.test(w)) { w = w.replace(re,"$1$2"); }
		else if (re2.test(w)) {	w = w.replace(re2,"$1$2"); }

		// Step 1b
		re = /^(.+?)eed$/;
		re2 = /^(.+?)(ed|ing)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			re = new RegExp(mgr0);
			if (re.test(fp[1])) {
				re = /.$/;
				w = w.replace(re,"");
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1];
			re2 = new RegExp(s_v);
			if (re2.test(stem)) {
				w = stem;
				re2 = /(at|bl|iz)$/;
				re3 = new RegExp("([^aeiouylsz])\\1$");
				re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
				if (re2.test(w)) {	w = w + "e"; }
				else if (re3.test(w)) { re = /.$/; w = w.replace(re,""); }
				else if (re4.test(w)) { w = w + "e"; }
			}
		}

		// Step 1c
		re = /^(.+?)y$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(s_v);
			if (re.test(stem)) { w = stem + "i"; }
		}

		// Step 2
		re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step2list[suffix];
			}
		}

		// Step 3
		re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			suffix = fp[2];
			re = new RegExp(mgr0);
			if (re.test(stem)) {
				w = stem + step3list[suffix];
			}
		}

		// Step 4
		re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
		re2 = /^(.+?)(s|t)(ion)$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			if (re.test(stem)) {
				w = stem;
			}
		} else if (re2.test(w)) {
			var fp = re2.exec(w);
			stem = fp[1] + fp[2];
			re2 = new RegExp(mgr1);
			if (re2.test(stem)) {
				w = stem;
			}
		}

		// Step 5
		re = /^(.+?)e$/;
		if (re.test(w)) {
			var fp = re.exec(w);
			stem = fp[1];
			re = new RegExp(mgr1);
			re2 = new RegExp(meq1);
			re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
			if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
				w = stem;
			}
		}

		re = /ll$/;
		re2 = new RegExp(mgr1);
		if (re.test(w) && re2.test(w)) {
			re = /.$/;
			w = w.replace(re,"");
		}

		// and turn initial Y back to y

		if (firstch == "y") {
			w = firstch.toLowerCase() + w.substr(1);
		}
		
		return w;
	}
})();

var syllabus = [];
function createSyllabusData(){

	var type1 = ["unit-1","unit-2","unit-3","unit-4"];
	var type2 = ["module-1","module-2","module-3","module-4"];
	var type3 = ["section-1","section-2","section-3","section-4"];
	var nameType = "1";
	var low = JSON.parse(tokenizedSyllabus);
	low = low.join(" ");
	low = low.toLowerCase();
	
    if(nameType == "1"){

        unitPosition = [];
        slicedArrays = [];
        allunittopics = [];
        unit1words = [];
        unit2words = [];
        unit3words = [];
        unit4words = [];
        allunitwords = [];
        unit1stemmed = [];
        unit2stemmed = [];
        unit3stemmed = [];
        unit4stemmed = [];
        allunitstemmed = [];
		syllabus.length = 0;


		// syllabus cleaning for identifying units
		// --case1= UNIT -1
		// --case2= UNIT - 1
		// --case3= UNIT- 1
		// --case4= UNIT ~1
		// --case5= UNIT ~ 1
		// --case6= UNIT~ 1
		// --case7= UNIT _1
		// --case8= UNIT _ 1
		// --case9= UNIT_ 1
		// --case10= UNIT =1
		// --case11= UNIT = 1
		// --case12= UNIT= 1

		// --UNIT 1
		var unit1Case1 = low.replace(/unit -1/g, 'unit-1');
		var unit1Case2 = unit1Case1.replace(/unit - 1/g, 'unit-1');
		var unit1Case3 = unit1Case2.replace(/unit- 1/g, 'unit-1');
		var unit1Case4 = unit1Case3.replace(/unit ~1/g, 'unit-1');
		var unit1Case5 = unit1Case4.replace(/unit ~ 1/g, 'unit-1');
		var unit1Case6 = unit1Case5.replace(/unit~ 1/g, 'unit-1');
		var unit1Case7 = unit1Case6.replace(/unit _1/g, 'unit-1');
		var unit1Case8 = unit1Case7.replace(/unit _ 1/g, 'unit-1');
		var unit1Case9 = unit1Case8.replace(/unit_ 1/g, 'unit-1');
		var unit1Case10 = unit1Case9.replace(/unit =1/g, 'unit-1');
		var unit1Case11 = unit1Case10.replace(/unit = 1/g, 'unit-1');
		var unit1Case12 = unit1Case11.replace(/unit= 1/g, 'unit-1');
		// --UNIT 2
		var unit2Case1 = unit1Case12.replace(/unit -2/g, 'unit-2');
		var unit2Case2 = unit2Case1.replace(/unit - 2/g, 'unit-2');
		var unit2Case3 = unit2Case2.replace(/unit- 2/g, 'unit-2');
		var unit2Case4 = unit2Case3.replace(/unit ~2/g, 'unit-2');
		var unit2Case5 = unit2Case4.replace(/unit ~ 2/g, 'unit-2');
		var unit2Case6 = unit2Case5.replace(/unit~ 2/g, 'unit-2');
		var unit2Case7 = unit2Case6.replace(/unit _2/g, 'unit-2');
		var unit2Case8 = unit2Case7.replace(/unit _ 2/g, 'unit-2');
		var unit2Case9 = unit2Case8.replace(/unit_ 2/g, 'unit-2');
		var unit2Case10 = unit2Case9.replace(/unit =2/g, 'unit-2');
		var unit2Case11 = unit2Case10.replace(/unit = 2/g, 'unit-2');
		var unit2Case12 = unit2Case11.replace(/unit= 2/g, 'unit-2');
		// --UNIT 3
		var unit3Case1 = unit2Case12.replace(/unit -3/g, 'unit-3');
		var unit3Case2 = unit3Case1.replace(/unit - 3/g, 'unit-3');
		var unit3Case3 = unit3Case2.replace(/unit- 3/g, 'unit-3');
		var unit3Case4 = unit3Case3.replace(/unit ~3/g, 'unit-3');
		var unit3Case5 = unit3Case4.replace(/unit ~ 3/g, 'unit-3');
		var unit3Case6 = unit3Case5.replace(/unit~ 3/g, 'unit-3');
		var unit3Case7 = unit3Case6.replace(/unit _3/g, 'unit-3');
		var unit3Case8 = unit3Case7.replace(/unit _ 3/g, 'unit-3');
		var unit3Case9 = unit3Case8.replace(/unit_ 3/g, 'unit-3');
		var unit3Case10 = unit3Case9.replace(/unit =3/g, 'unit-3');
		var unit3Case11 = unit3Case10.replace(/unit = 3/g, 'unit-3');
		var unit3Case12 = unit3Case11.replace(/unit= 3/g, 'unit-3');
		// --UNIT 4
		var unit4Case1 = unit3Case12.replace(/unit -4/g, 'unit-4');
		var unit4Case2 = unit4Case1.replace(/unit - 4/g, 'unit-4');
		var unit4Case3 = unit4Case2.replace(/unit- 4/g, 'unit-4');
		var unit4Case4 = unit4Case3.replace(/unit ~4/g, 'unit-4');
		var unit4Case5 = unit4Case4.replace(/unit ~ 4/g, 'unit-4');
		var unit4Case6 = unit4Case5.replace(/unit~ 4/g, 'unit-4');
		var unit4Case7 = unit4Case6.replace(/unit _4/g, 'unit-4');
		var unit4Case8 = unit4Case7.replace(/unit _ 4/g, 'unit-4');
		var unit4Case9 = unit4Case8.replace(/unit_ 4/g, 'unit-4');
		var unit4Case10 = unit4Case9.replace(/unit =4/g, 'unit-4');
		var unit4Case11 = unit4Case10.replace(/unit = 4/g, 'unit-4');
		var finalSyllabusString = unit4Case11.replace(/unit= 4/g, 'unit-4');

		var finalSyllabusArray = finalSyllabusString.split(" ");
		

        for(i = 0; i < type1.length; i++){
            if(finalSyllabusArray.indexOf(type1[i]) > -1){
                unitPosition.push(finalSyllabusArray.indexOf(type1[i]));
            }			
		}
		for(i = 0; i < unitPosition.length; i++){
			slicedArrays.push(finalSyllabusArray.slice(unitPosition[i]+1, unitPosition[i+1]));
        }
        

        function removeModBullets(slicedArrays){        // creating TOPICS-----------------------------------------------------

            string = slicedArrays.join(" ");
            wave = string.replace(/~/g, '-');
            spaceDashSpace = wave.replace(/ - /g, ',');
            spaceDash = spaceDashSpace.replace(/ -/g, ',');
            dashSpace = spaceDash.replace(/- /g, ',');
            dash = dashSpace.replace(/-/g, ' ');
            oppostophe = dash.replace(/'s/g, ' ');
            dot = oppostophe.replace(/[.:)()]/g, ',');
            and = dot.replace(/ and /g, ',');
            spaceComma = and.replace(/ ,/g, ',');                   
            commaSpace = spaceComma.replace(/, /g, ',');
            twoCommas = commaSpace.replace(/,,/g, ',');
            threeCommas = twoCommas.replace(/,,,/g, ',');
            cleanedArray = threeCommas.split(",");

            allunittopics.push(cleanedArray);
        }
        for(j = 0; j < slicedArrays.length; j++){
            removeModBullets(slicedArrays[j]);
        }


        function removeStopwords(unitwords, unittopic){        // creating separate UNIT words
            
            temp = [];
			temp.length = 0;
			words = unittopic.split(' ');
			for(i=0;i<words.length;i++) {
				word_clean = words[i].split(".").join("");
				if(!stopwords.includes(word_clean)) {
					temp.push(word_clean);
				}
			}
			unitwords.push(temp);	
        }
        for(j = 0; j < allunittopics[0].length; j++){
            removeStopwords(unit1words, allunittopics[0][j]);
        }
        for(j = 0; j < allunittopics[1].length; j++){
            removeStopwords(unit2words, allunittopics[1][j]);
        }
        for(j = 0; j < allunittopics[2].length; j++){
            removeStopwords(unit3words, allunittopics[2][j]);
        }
        for(j = 0; j < allunittopics[3].length; j++){
            removeStopwords(unit4words, allunittopics[3][j]);
        }


        function stemming(unitstemmed, unitwords){        // creating stemmed words
            
            temp =[];
			temp.length = 0;

			for(i = 0; i < unitwords.length; i++){
				temp.push(stemmer(unitwords[i]));
			}
			unitstemmed.push(temp);
        }
        for(j = 0; j < unit1words.length; j++){
            stemming(unit1stemmed, unit1words[j]);
        }
        for(j = 0; j < unit2words.length; j++){
            stemming(unit2stemmed, unit2words[j]);
        }
        for(j = 0; j < unit3words.length; j++){
            stemming(unit3stemmed, unit3words[j]);
        }
        for(j = 0; j < unit4words.length; j++){
            stemming(unit4stemmed, unit4words[j]);
        }


        allunitwords.push(unit1words, unit2words, unit3words, unit4words);
        allunitstemmed.push(unit1stemmed, unit2stemmed, unit3stemmed, unit4stemmed);

        for(i = 0; i < allunittopics.length; i++){
            syllabus.push({topic: allunittopics[i],
                           words: allunitwords[i],
                           stemmedWords: allunitstemmed[i]
                        });
        }

	}	
	
	return syllabus;

}

var qpaper = [];
function createQpaperData(){
	
	var two = JSON.parse(qpaperdata);
	// two = JSON.stringify(two);
	qpaper.length = 0;
	questions = [];
    words = [];
	stemmedWords = [];  
    for(var i = 0; i < two.length; i++){  // MODULE 1 --------------------------------------------
        questions = questions.concat(two[i][0].questions);
        words = words.concat(two[i][0].words);
        stemmedWords = stemmedWords.concat(two[i][0].stemmedWords); 
	}	
	qpaper.push({questions: questions,
		            words: words,
		            stemmedWords: stemmedWords 
					});				
	
	
	questions = [];
	words = [];
	stemmedWords = [];	
	for(var i = 0; i < two.length; i++){  // MODULE 2 -----------------------------------------------------
		questions = questions.concat(two[i][1].questions);
		words = words.concat(two[i][1].words);
		stemmedWords = stemmedWords.concat(two[i][1].stemmedWords); 
	}
	qpaper.push({questions: questions,
					words: words,
					stemmedWords: stemmedWords 
					});


	questions = [];
	words = [];
	stemmedWords = [];
    for(var i = 0; i < two.length; i++){  // MODULE 3 -----------------------------------------------------------
		questions = questions.concat(two[i][2].questions);
		words = words.concat(two[i][2].words);
		stemmedWords = stemmedWords.concat(two[i][2].stemmedWords); 
	}
	qpaper.push({questions: questions,
					words: words,
					stemmedWords: stemmedWords 
					});


	questions = [];
	words = [];
	stemmedWords = [];
	for(var i = 0; i < two.length; i++){  // MODULE 4 --------------------------------------------------------
		questions = questions.concat(two[i][3].questions);
		words = words.concat(two[i][3].words);
		stemmedWords = stemmedWords.concat(two[i][3].stemmedWords); 
	}
	qpaper.push({questions: questions,
		            words: words,
		            stemmedWords: stemmedWords 
					});								
	
	
	return qpaper;
					
}

var unitquestions = [];     
function generateQuestions(){

	unit1topicquestions = [];
	unit2topicquestions = [];
	unit3topicquestions = [];
	unit4topicquestions = [];


	for(var i = 0; i < syllabus[0].stemmedWords.length; i++){ //  UNIT 1 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[0].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[0].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[0].stemmedWords[k].length; l++){
					if(qpaper[0].stemmedWords[k][l] === syllabus[0].stemmedWords[i][j]){
						count++;
						if(!temp.includes(qpaper[0].questions[k])){
							temp.push(qpaper[0].questions[k]);
						}                                
					}                                                       
				}                                              
			}
			// if(count > 0 && !occurences.includes(syllabus[0].topic[i])){
			// occurences.push(syllabus[0].topic[i], count);                    
			// }   
		}
		if(temp.length > 0){
			unit1topicquestions.push(temp);
		}                 
	}unitquestions.push(unit1topicquestions);  


	for(var i = 0; i < syllabus[1].stemmedWords.length; i++){ //  UNIT 2 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[1].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[1].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[1].stemmedWords[k].length; l++){
					if(qpaper[1].stemmedWords[k][l] === syllabus[1].stemmedWords[i][j]){
						count++;
						if(!temp.includes(qpaper[1].questions[k])){
							temp.push(qpaper[1].questions[k]);
						}                                
					}                                                       
				}                                              
			}
			// if(count > 0 && !occurences.includes(syllabus[1].topic[i])){
			// occurences.push(syllabus[1].topic[i], count);                    
			// }   
		}
		if(temp.length > 0){
			unit2topicquestions.push(temp);
		}                 
	}unitquestions.push(unit2topicquestions);  


	for(var i = 0; i < syllabus[2].stemmedWords.length; i++){ //  UNIT 3 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[2].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[2].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[2].stemmedWords[k].length; l++){
					if(qpaper[2].stemmedWords[k][l] === syllabus[2].stemmedWords[i][j]){
						count++;
						if(!temp.includes(qpaper[2].questions[k])){
							temp.push(qpaper[2].questions[k]);
						}                                
					}                                                       
				}                                              
			}
			// if(count > 0 && !occurences.includes(syllabus[2].topic[i])){
			// occurences.push(syllabus[2].topic[i], count);                    
			// }   
		}
		if(temp.length > 0){
			unit3topicquestions.push(temp);
		}                 
	}unitquestions.push(unit3topicquestions);  


	for(var i = 0; i < syllabus[3].stemmedWords.length; i++){ //  UNIT 4 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[3].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[3].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[3].stemmedWords[k].length; l++){
					if(qpaper[3].stemmedWords[k][l] === syllabus[3].stemmedWords[i][j]){
						count++;
						if(!temp.includes(qpaper[3].questions[k])){
							temp.push(qpaper[3].questions[k]);
						}                                
					}                                                       
				}                                              
			}
			// if(count > 0 && !occurences.includes(syllabus[3].topic[i])){
			// occurences.push(syllabus[3].topic[i], count);                    
			// }   
		}
		if(temp.length > 0){
			unit4topicquestions.push(temp);
		}                 
	}unitquestions.push(unit4topicquestions);       
	
	
	return unitquestions;
    
} 

var unitscores = [];     
function generateScores(){

	unit1topicquestions = [];
	unit2topicquestions = [];
	unit3topicquestions = [];
	unit4topicquestions = [];


	for(var i = 0; i < syllabus[0].stemmedWords.length; i++){ //  UNIT 1 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[0].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[0].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[0].stemmedWords[k].length; l++){
					if(qpaper[0].stemmedWords[k][l] === syllabus[0].stemmedWords[i][j]){
						count++;
						// if(!temp.includes(qpaper[0].questions[k])){
						// 	temp.push(qpaper[0].questions[k]);
						// }                                
					}                                                       
				}                                              
			}
			if(count > 0 && !unit1topicquestions.includes(syllabus[0].topic[i])){
				unit1topicquestions.push(syllabus[0].topic[i], count);                    
			}   
		}
		// if(temp.length > 0){
		// 	unit1topicquestions.push(temp);
		// }                 
	}unitscores.push(unit1topicquestions);  


	for(var i = 0; i < syllabus[1].stemmedWords.length; i++){ //  UNIT 2 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[1].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[1].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[1].stemmedWords[k].length; l++){
					if(qpaper[1].stemmedWords[k][l] === syllabus[1].stemmedWords[i][j]){
						count++;
						// if(!temp.includes(qpaper[1].questions[k])){
						// 	temp.push(qpaper[1].questions[k]);
						// }                                
					}                                                       
				}                                              
			}
			if(count > 0 && !unit2topicquestions.includes(syllabus[1].topic[i])){
				unit2topicquestions.push(syllabus[1].topic[i], count);                    
			}   
		}
		// if(temp.length > 0){
		// 	unit2topicquestions.push(temp);
		// }                 
	}unitscores.push(unit2topicquestions);  


	for(var i = 0; i < syllabus[2].stemmedWords.length; i++){ //  UNIT 3 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[2].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[2].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[2].stemmedWords[k].length; l++){
					if(qpaper[2].stemmedWords[k][l] === syllabus[2].stemmedWords[i][j]){
						count++;
						// if(!temp.includes(qpaper[2].questions[k])){
						// 	temp.push(qpaper[2].questions[k]);
						// }                                
					}                                                       
				}                                              
			}
			if(count > 0 && !unit3topicquestions.includes(syllabus[2].topic[i])){
				unit3topicquestions.push(syllabus[2].topic[i], count);                    
			}   
		}
		// if(temp.length > 0){
		// 	unit3topicquestions.push(temp);
		// }                 
	}unitscores.push(unit3topicquestions);  


	for(var i = 0; i < syllabus[3].stemmedWords.length; i++){ //  UNIT 4 -------------------------------------------
		var temp = [];
		for(var j = 0; j < syllabus[3].stemmedWords[i].length; j++){                    
			var count = 0;
			for(var k = 0; k < qpaper[3].stemmedWords.length; k++){
				for(var l = 0; l < qpaper[3].stemmedWords[k].length; l++){
					if(qpaper[3].stemmedWords[k][l] === syllabus[3].stemmedWords[i][j]){
						count++;
						// if(!temp.includes(qpaper[3].questions[k])){
						// 	temp.push(qpaper[3].questions[k]);
						// }                                
					}                                                       
				}                                              
			}
			if(count > 0 && !unit4topicquestions.includes(syllabus[3].topic[i])){
				unit4topicquestions.push(syllabus[3].topic[i], count);                    
			}   
		}
		// if(temp.length > 0){
		// 	unit4topicquestions.push(temp);
		// }                 
	}unitscores.push(unit4topicquestions);       

	unitatoprint = [];
	unitbtoprint = [];
	unitctoprint = [];
	unitdtoprint = [];
	for(var i = 0; i < unit1topicquestions.length; i++){
		var unitatopicquestions = unit1topicquestions[i].concat("  appeared  ");
		unitatopicquestions = unitatopicquestions.concat(unit1topicquestions[i+1]);
		unitatopicquestions = unitatopicquestions.concat("  times");
		unitatoprint.push(unitatopicquestions);
		i = i+1;
	}

	for(var i = 0; i < unit2topicquestions.length; i++){
		var unitbtopicquestions = unit2topicquestions[i].concat("  appeared  ");
		unitbtopicquestions = unitbtopicquestions.concat(unit2topicquestions[i+1]);
		unitbtopicquestions = unitbtopicquestions.concat("  times");
		unitbtoprint.push(unitbtopicquestions);
		i = i+1;
	}

	for(var i = 0; i < unit3topicquestions.length; i++){
		var unitctopicquestions = unit3topicquestions[i].concat("  appeared  ");
		unitctopicquestions = unitctopicquestions.concat(unit3topicquestions[i+1]);
		unitctopicquestions = unitctopicquestions.concat("  times");
		unitctoprint.push(unitctopicquestions);
		i = i+1;
	}

	for(var i = 0; i < unit4topicquestions.length; i++){
		var unitdtopicquestions = unit4topicquestions[i].concat("  appeared  ");
		unitdtopicquestions = unitdtopicquestions.concat(unit4topicquestions[i+1]);
		unitdtopicquestions = unitdtopicquestions.concat("  times");
		unitdtoprint.push(unitdtopicquestions);
		i = i+1;
	}

	
	document.getElementById("1scores").innerHTML = unitatoprint.join("<br>");
	document.getElementById("2scores").innerHTML = unitbtoprint.join("<br>");
	document.getElementById("3scores").innerHTML = unitctoprint.join("<br>");
	document.getElementById("4scores").innerHTML = unitdtoprint.join("<br>");

} 

function randomizeQuestions(){

	finalQuestions = [];

	for (var i = 0; i < unitquestions.length; i++) {
		temp = [];
		for (var j = 0; j < unitquestions[i].length; j++) {
			var len = unitquestions[i][j].length;
			var index = Math.floor((Math.random() * len) + 0);
			if (!temp.includes(unitquestions[i][j][index])) {
				temp.push(unitquestions[i][j][index]);
			}
		}
		finalQuestions.push(temp);
	}
				
	
	

	eachUnit1QuestionsForPdf = [];
	eachUnit2QuestionsForPdf = [];
	eachUnit3QuestionsForPdf = [];
	eachUnit4QuestionsForPdf = [];

	function addBulletsToQuestions(eachUnitQuestions, eachFinalQuestions){

		for(var i = 0; i < eachFinalQuestions.length; i++){
			temp2 = eachFinalQuestions[i].concat(eachFinalQuestions.indexOf(eachFinalQuestions[i])+2);
			eachUnitQuestions.push(temp2);
		}

	}
	addBulletsToQuestions(eachUnit1QuestionsForPdf, finalQuestions[0]);
	addBulletsToQuestions(eachUnit2QuestionsForPdf, finalQuestions[1]);
	addBulletsToQuestions(eachUnit3QuestionsForPdf, finalQuestions[2]);
	addBulletsToQuestions(eachUnit4QuestionsForPdf, finalQuestions[3]);


	var starter = "1. ";

	var finalEachUnitQuestionsArray = [];

	function addingStarter(){

		eachUnit1QuestionsForPdf = eachUnit1QuestionsForPdf.join(". ");
		eachUnit1QuestionsForPdf = starter.concat(eachUnit1QuestionsForPdf);
		var finalEachUnit1QuestionsForPdf = eachUnit1QuestionsForPdf.slice(0, -1);
		finalEachUnit1QuestionsForPdf = finalEachUnit1QuestionsForPdf.slice(0, -1);
		finalEachUnitQuestionsArray.push(finalEachUnit1QuestionsForPdf);

		eachUnit2QuestionsForPdf = eachUnit2QuestionsForPdf.join(". ");
		eachUnit2QuestionsForPdf = starter.concat(eachUnit2QuestionsForPdf);
		var finalEachUnit2QuestionsForPdf = eachUnit2QuestionsForPdf.slice(0, -1);
		finalEachUnit2QuestionsForPdf = finalEachUnit2QuestionsForPdf.slice(0, -1);
		finalEachUnitQuestionsArray.push(finalEachUnit2QuestionsForPdf);

		eachUnit3QuestionsForPdf = eachUnit3QuestionsForPdf.join(". ");
		eachUnit3QuestionsForPdf = starter.concat(eachUnit3QuestionsForPdf);
		var finalEachUnit3QuestionsForPdf = eachUnit3QuestionsForPdf.slice(0, -1);
		finalEachUnit3QuestionsForPdf = finalEachUnit3QuestionsForPdf.slice(0, -1);
		finalEachUnitQuestionsArray.push(finalEachUnit3QuestionsForPdf);

		eachUnit4QuestionsForPdf = eachUnit4QuestionsForPdf.join(". ");
		eachUnit4QuestionsForPdf = starter.concat(eachUnit4QuestionsForPdf);
		var finalEachUnit4QuestionsForPdf = eachUnit4QuestionsForPdf.slice(0, -1);
		finalEachUnit4QuestionsForPdf = finalEachUnit4QuestionsForPdf.slice(0, -1);
		finalEachUnitQuestionsArray.push(finalEachUnit4QuestionsForPdf);

	}
	addingStarter();

	
	unit1SeparateQuestionsToPrint = [];
	unit2SeparateQuestionsToPrint = [];
	unit3SeparateQuestionsToPrint = [];
	unit4SeparateQuestionsToPrint = [];

	function creatingSeparateQuestionsToPrint(unitSeparateQuestionsToPrint, finalEachUnitQarray){

		indices = [];
		for(var i=0; i<finalEachUnitQarray.length;i++) {
			if(finalEachUnitQarray[i] === "\n"){
				indices.push(i);
			} 
		}

		
		if(indices.length <= 46){
			str1 = finalEachUnitQarray.slice(0);
			
			unitSeparateQuestionsToPrint.push(str1);
		}
		
		if(indices.length > 46 && indices.length <= 92){
			str1 = finalEachUnitQarray.slice(0, indices[45]+1);
			str2 = finalEachUnitQarray.slice(indices[45]+1);
			
			unitSeparateQuestionsToPrint.push(str1);
			unitSeparateQuestionsToPrint.push(str2);
		}
		
		if(indices.length > 92 && indices.length <=138){
			str1 = finalEachUnitQarray.slice(0, indices[45]+1);
			str2 = finalEachUnitQarray.slice(indices[45]+1, indices[91]+1);
			str3 = finalEachUnitQarray.slice(indices[91]+1);

			unitSeparateQuestionsToPrint.push(str1);
			unitSeparateQuestionsToPrint.push(str2);
			unitSeparateQuestionsToPrint.push(str3);
		}  

		if(indices.length > 138 && indices.length <= 184){
			str1 = finalEachUnitQarray.slice(0, indices[45]+1);
			str2 = finalEachUnitQarray.slice(indices[45]+1, indices[91]+1);
			str3 = finalEachUnitQarray.slice(indices[91]+1, indices[137]+1);
			str4 = finalEachUnitQarray.slice(indices[137]+1);

			unitSeparateQuestionsToPrint.push(str1);
			unitSeparateQuestionsToPrint.push(str2);
			unitSeparateQuestionsToPrint.push(str3);
			unitSeparateQuestionsToPrint.push(str4);
		}

		if(indices.length > 184 && indices.length <= 230){
			str1 = finalEachUnitQarray.slice(0, indices[45]+1);
			str2 = finalEachUnitQarray.slice(indices[45]+1, indices[91]+1);
			str3 = finalEachUnitQarray.slice(indices[91]+1, indices[137]+1);
			str4 = finalEachUnitQarray.slice(indices[137]+1, indices[183]+1);
			str5 = finalEachUnitQarray.slice(indices[183]+1);

			unitSeparateQuestionsToPrint.push(str1);
			unitSeparateQuestionsToPrint.push(str2);
			unitSeparateQuestionsToPrint.push(str3);
			unitSeparateQuestionsToPrint.push(str4);
			unitSeparateQuestionsToPrint.push(str5);
		} 

		if(indices.length > 230){
			str1 = finalEachUnitQarray.slice(0, indices[45]+1);
			str2 = finalEachUnitQarray.slice(indices[45]+1, indices[91]+1);
			str3 = finalEachUnitQarray.slice(indices[91]+1, indices[137]+1);
			str4 = finalEachUnitQarray.slice(indices[137]+1, indices[183]+1);
			str5 = finalEachUnitQarray.slice(indices[183]+1, indices[229]+1);
			str6 = finalEachUnitQarray.slice(indices[229]+1);

			unitSeparateQuestionsToPrint.push(str1);
			unitSeparateQuestionsToPrint.push(str2);
			unitSeparateQuestionsToPrint.push(str3);
			unitSeparateQuestionsToPrint.push(str4);
			unitSeparateQuestionsToPrint.push(str5);
			unitSeparateQuestionsToPrint.push(str6);
		}


	}
	creatingSeparateQuestionsToPrint(unit1SeparateQuestionsToPrint, finalEachUnitQuestionsArray[0]);
	creatingSeparateQuestionsToPrint(unit2SeparateQuestionsToPrint, finalEachUnitQuestionsArray[1]);
	creatingSeparateQuestionsToPrint(unit3SeparateQuestionsToPrint, finalEachUnitQuestionsArray[2]);
	creatingSeparateQuestionsToPrint(unit4SeparateQuestionsToPrint, finalEachUnitQuestionsArray[3]);


	
	function printQuestions(){

		var doc = new jsPDF();

		if(unit1SeparateQuestionsToPrint.length == 1){  // UNIT 1 ---------------------------------------------
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 1 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit1SeparateQuestionsToPrint[0], 17, 33);
		}
		if(unit1SeparateQuestionsToPrint.length > 1){
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 1 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit1SeparateQuestionsToPrint[0], 17, 33);

			for(var i = 1; i < unit1SeparateQuestionsToPrint.length; i++){
				doc.addPage();
				doc.setFont('normal');
				doc.setFontType('normal');
				doc.setFontSize(13);
				doc.text(unit1SeparateQuestionsToPrint[i], 17, 33);
			}
		}

		if(unit2SeparateQuestionsToPrint.length == 1){  // UNIT 2 ---------------------------------------------
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 2 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit2SeparateQuestionsToPrint[0], 17, 33);
		}
		if(unit2SeparateQuestionsToPrint.length > 1){
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 2 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit2SeparateQuestionsToPrint[0], 17, 33);

			for(var i = 1; i < unit2SeparateQuestionsToPrint.length; i++){
				doc.addPage();
				doc.setFont('normal');
				doc.setFontType('normal');
				doc.setFontSize(13);
				doc.text(unit2SeparateQuestionsToPrint[i], 17, 33);
			}
		}

		if(unit3SeparateQuestionsToPrint.length == 1){  // UNIT 3 ----------------------------------------------
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 3 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit3SeparateQuestionsToPrint[0], 17, 33);
		}
		if(unit3SeparateQuestionsToPrint.length > 1){
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 3 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit3SeparateQuestionsToPrint[0], 17, 33);

			for(var i = 1; i < unit3SeparateQuestionsToPrint.length; i++){
				doc.addPage();
				doc.setFont('normal');
				doc.setFontType('normal');
				doc.setFontSize(13);
				doc.text(unit3SeparateQuestionsToPrint[i], 17, 33);
			}
		}

		if(unit4SeparateQuestionsToPrint.length == 1){  // UNIT 4 -----------------------------------------------
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 4 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit4SeparateQuestionsToPrint[0], 17, 33);
		}
		if(unit1SeparateQuestionsToPrint.length > 1){
			doc.addPage();
			doc.setFont('helvetica');
			doc.setFontType('bold');
			doc.setFontSize(18);
			doc.text(70, 22, 'UNIT 4 QUESTIONS');

			doc.setFont('normal');
			doc.setFontType('normal');
			doc.setFontSize(13);
			doc.text(unit4SeparateQuestionsToPrint[0], 17, 33);

			for(var i = 1; i < unit4SeparateQuestionsToPrint.length; i++){
				doc.addPage();
				doc.setFont('normal');
				doc.setFontType('normal');
				doc.setFontSize(13);
				doc.text(unit4SeparateQuestionsToPrint[i], 17, 33);
			}
		}

		doc.save('Question Bank.pdf');

	}
	printQuestions();	
	
	
	return document.getElementById("message").innerHTML = "Click the button again to generate a different set of questions";		

}