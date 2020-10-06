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


document.getElementById("qpaperData").innerHTML = qpaperData;

function editQpaper(){

    var type1 = ["PART-A","PART-B","PART-C"];
    var type2 = ["MODULE-1","MODULE-2","MODULE-3","MODULE-4"];
    var mainquest = ["1.","2.","3.","4.","5.","6.","7.","8."];
    var subquest = ["a)","b)","c)","d)","e)","f)","g)","h)"];
    var patternType = document.getElementById("patternType").value;
    var qpaperInitialData = document.getElementById("qpaperData").value;
    qpaperInitialData = qpaperInitialData.replace(/\n+/g, ' ');
	qpaperInitialData = qpaperInitialData.split(" ");
	var qpaperOriginalData = document.getElementById("qpaperData").value;
	qpaperOriginalData = qpaperOriginalData.replace(/\n+/g, '\\n ');
	qpaperOriginalData = qpaperOriginalData.split(" ");


    if(patternType == "1"){        // for pattern type1-----------------------------------------------------------

        partsposition = [];
		slicedArrays = [];
		partAmain = [];
		partBmain = [];
		partCmain = [];
	
		partAsub = [];
		partBsub = [];
        partCsub = [];

		partAquestions = [];
		partBquestions = [];
		partCquestions = [];
	
		allpartsquestions = [];
		partAwords = [];
		partBwords = [];
		partCwords = [];

		allpartswords = [];
		partAstemmed = [];
		partBstemmed = [];
		partCstemmed = [];
	
        allpartsstemmed = [];
        qpaperFinalData = [];

        qpaperFinalData.length = 0;
		// removing PART bullets
		for(i = 0; i < type1.length; i++){
			partsposition.push(qpaperInitialData.indexOf(type1[i]));
		}
		for(i = 0; i < partsposition.length; i++){
			slicedArrays.push(qpaperInitialData.slice(partsposition[i]+1, partsposition[i+1]));
		}


		function mainquestBullets(partmain, slicedArrays){        // removing main question bullets

	        temp = [];
			temp.length = 0;

			for(i = 0; i < mainquest.length; i++){
				if(slicedArrays.indexOf(mainquest[i]) > -1){
					temp.push(slicedArrays.indexOf(mainquest[i]));
				}
			}
			for(i = 0; i < temp.length; i++){
				partmain.push(slicedArrays.slice(temp[i]+1, temp[i+1]));
			}
		}	
		mainquestBullets(partAmain, slicedArrays[0]);
		mainquestBullets(partBmain, slicedArrays[1]);
		mainquestBullets(partCmain, slicedArrays[2]);


		function subquestBullets(partsub, partmain){           // removing sub questions bullets

	        temp = [];
			temp.length = 0;

			for(i = 0; i < subquest.length; i++){
				if(partmain.indexOf(subquest[i]) > -1){
					temp.push(partmain.indexOf(subquest[i]));
				}
			}
			for(i = 0; i < temp.length; i++){
				partsub.push(partmain.slice(temp[i]+1, temp[i+1]));
			}		
		}
		for(j = 0; j < partAmain.length; j++){
			subquestBullets(partAsub, partAmain[j]);
		}
		for(j = 0; j < partBmain.length; j++){
			subquestBullets(partBsub, partBmain[j]);
		}
		for(j = 0; j < partCmain.length; j++){
			subquestBullets(partCsub, partCmain[j]);
		}


		function convertToString(partquestions, partsub){        // convert questions to string

	        partquestions.push(partsub.join(" "));
		}
		for(i = 0; i < partAsub.length; i++){
			convertToString(partAquestions, partAsub[i]);
		}
		for(i = 0; i < partBsub.length; i++){
			convertToString(partBquestions, partBsub[i]);
		}
		for(i = 0; i < partCsub.length; i++){
			convertToString(partCquestions, partCsub[i]);
		}


		function removeStopwords(partwords, partquestions) {        // removing stopwords

	        temp = [];
			temp.length = 0;
			words = partquestions.split(' ');
			for(i=0;i<words.length;i++) {
				word_clean = words[i].split(".").join("");
				if(!stopwords.includes(word_clean)) {
					temp.push(word_clean);
				}
			}
			partwords.push(temp);	
		}	
		for(j = 0; j < partAquestions.length; j++){
			removeStopwords(partAwords, partAquestions[j]);
		}
		for(j = 0; j < partBquestions.length; j++){
			removeStopwords(partBwords, partBquestions[j]);
		}	
		for(j = 0; j < partCquestions.length; j++){
			removeStopwords(partCwords, partCquestions[j]);
		}	


		function stemming(partstemmed, partwords){        // stemming question words

	        temp =[];
			temp.length = 0;

			for(i = 0; i < partwords.length; i++){
				temp.push(stemmer(partwords[i]));
			}
			partstemmed.push(temp);
		}
		for(j = 0; j < partAwords.length; j++){
			stemming(partAstemmed, partAwords[j]);
		}
		for(j = 0; j < partBwords.length; j++){
			stemming(partBstemmed, partBwords[j]);
		}
		for(j = 0; j < partCwords.length; j++){
			stemming(partCstemmed, partCwords[j]);
		}


		allpartsquestions.push(partAquestions, partBquestions, partCquestions);
		allpartswords.push(partAwords, partBwords, partCwords);
		allpartsstemmed.push(partAstemmed, partBstemmed, partCstemmed);

		for(i = 0; i < allpartsquestions.length; i++){
			qpaperFinalData.push({questions: allpartsquestions[i],
			            words: allpartswords[i],
						stemmedWords: allpartsstemmed[i]
					});
        }	
        qpaperFinalData = JSON.stringify(qpaperFinalData);
        localStorage.setItem("qpaperstring", qpaperFinalData);

	} // pattern type1 ends----------------------------------------------------------

    
	if(patternType == "2"){        // for pattern type2--------------------------------------------------------

		modposition = [];
		slicedArrays = [];
		originalmodposition = [];
		originalslicedArrays = [];
		
		mod1main = [];
		mod2main = [];
		mod3main = [];
		mod4main = [];
		originalmod1main = [];
		originalmod2main = [];
		originalmod3main = [];
		originalmod4main = [];
		
		mod1sub = [];
		mod2sub = [];
		mod3sub = [];
		mod4sub = [];
		originalmod1sub = [];
		originalmod2sub = [];
		originalmod3sub = [];
		originalmod4sub = [];

		mod1questions = [];
		mod2questions = [];
		mod3questions = [];
		mod4questions = [];
		originalmod1questions = [];
		originalmod2questions = [];
		originalmod3questions = [];
		originalmod4questions = [];

		allmodquestions = [];
		mod1words = [];
		mod2words = [];
		mod3words = [];
		mod4words = [];
		allmodwords = [];
		mod1stemmed = [];
		mod2stemmed = [];
		mod3stemmed = [];
		mod4stemmed = [];
        allmodstemmed = [];
        qpaperFinalData = [];


        qpaperFinalData.length = 0;
		// removing MODULE bullets from Initial Data
		for(i = 0; i < type2.length; i++){
			modposition.push(qpaperInitialData.indexOf(type2[i]));
		}
		for(i = 0; i < modposition.length; i++){
			slicedArrays.push(qpaperInitialData.slice(modposition[i]+1, modposition[i+1]));
		}
		// removing MODULE bullets from Original Data
		for(i = 0; i < type2.length; i++){
			originalmodposition.push(qpaperOriginalData.indexOf(type2[i]));
		}
		for(i = 0; i < originalmodposition.length; i++){
			originalslicedArrays.push(qpaperOriginalData.slice(originalmodposition[i]+1, originalmodposition[i+1]));
		}


		function mainquestBullets(modmain, slicedArrays){        // removing main question bullets
		
            temp = [];
			temp.length = 0;

			for(i = 0; i < mainquest.length; i++){
				if(slicedArrays.indexOf(mainquest[i]) > -1){
					temp.push(slicedArrays.indexOf(mainquest[i]));
				}
			}
			for(i = 0; i < temp.length; i++){
				modmain.push(slicedArrays.slice(temp[i]+1, temp[i+1]));
			}
		}	
		mainquestBullets(mod1main, slicedArrays[0]);
		mainquestBullets(mod2main, slicedArrays[1]);
		mainquestBullets(mod3main, slicedArrays[2]);
		mainquestBullets(mod4main, slicedArrays[3]);

		mainquestBullets(originalmod1main, originalslicedArrays[0]);
		mainquestBullets(originalmod2main, originalslicedArrays[1]);
		mainquestBullets(originalmod3main, originalslicedArrays[2]);
		mainquestBullets(originalmod4main, originalslicedArrays[3]);


		function subquestBullets(modsub, modmain){         // removing sub questions bullets

            temp = [];
			temp.length = 0;

			for(i = 0; i < subquest.length; i++){
				if(modmain.indexOf(subquest[i]) > -1){
					temp.push(modmain.indexOf(subquest[i]));
				}
			}
			for(i = 0; i < temp.length; i++){
				modsub.push(modmain.slice(temp[i]+1, temp[i+1]));
			}		
		}
		for(j = 0; j < mod1main.length; j++){
			subquestBullets(mod1sub, mod1main[j]);
		}
		for(j = 0; j < mod2main.length; j++){
			subquestBullets(mod2sub, mod2main[j]);
		}
		for(j = 0; j < mod3main.length; j++){
			subquestBullets(mod3sub, mod3main[j]);
		}
		for(j = 0; j < mod4main.length; j++){
			subquestBullets(mod4sub, mod4main[j]);
		}

		for(j = 0; j < originalmod1main.length; j++){
			subquestBullets(originalmod1sub, originalmod1main[j]);
		}
		for(j = 0; j < originalmod2main.length; j++){
			subquestBullets(originalmod2sub, originalmod2main[j]);
		}
		for(j = 0; j < originalmod3main.length; j++){
			subquestBullets(originalmod3sub, originalmod3main[j]);
		}
		for(j = 0; j < originalmod4main.length; j++){
			subquestBullets(originalmod4sub, originalmod4main[j]);
		}



		function convertToString(modquestions, modsub){        // convert questions to string
		
		    modquestions.push(modsub.join(" "));
		}
		for(i = 0; i < mod1sub.length; i++){
			convertToString(mod1questions, mod1sub[i]);
		}
		for(i = 0; i < mod2sub.length; i++){
			convertToString(mod2questions, mod2sub[i]);
		}
		for(i = 0; i < mod3sub.length; i++){
			convertToString(mod3questions, mod3sub[i]);
		}
		for(i = 0; i < mod4sub.length; i++){
			convertToString(mod4questions, mod4sub[i]);
		}

		for(i = 0; i < originalmod1sub.length; i++){
			convertToString(originalmod1questions, originalmod1sub[i]);
		}
		for(i = 0; i < originalmod2sub.length; i++){
			convertToString(originalmod2questions, originalmod2sub[i]);
		}
		for(i = 0; i < originalmod3sub.length; i++){
			convertToString(originalmod3questions, originalmod3sub[i]);
		}
		for(i = 0; i < originalmod4sub.length; i++){
			convertToString(originalmod4questions, originalmod4sub[i]);
		}



		function removeStopwords(modwords, modquestions) {        // removing stopwords
		
		    temp = [];
			temp.length = 0;
			words = modquestions.split(' ');
			for(i=0;i<words.length;i++) {
				word_clean = words[i].split(".").join("");
				if(!stopwords.includes(word_clean)) {
					temp.push(word_clean);
				}
			}
			modwords.push(temp);	
		}	
		for(j = 0; j < mod1questions.length; j++){
			removeStopwords(mod1words, mod1questions[j]);
		}
		for(j = 0; j < mod2questions.length; j++){
			removeStopwords(mod2words, mod2questions[j]);
		}	
		for(j = 0; j < mod3questions.length; j++){
			removeStopwords(mod3words, mod3questions[j]);
		}	
		for(j = 0; j < mod4questions.length; j++){
			removeStopwords(mod4words, mod4questions[j]);
		}


		function stemming(modstemmed, modwords){        // stemming question words
		
		    temp =[];
			temp.length = 0;

			for(i = 0; i < modwords.length; i++){
				temp.push(stemmer(modwords[i]));
			}
			modstemmed.push(temp);
		}
		for(j = 0; j < mod1words.length; j++){
			stemming(mod1stemmed, mod1words[j]);
		}
		for(j = 0; j < mod2words.length; j++){
			stemming(mod2stemmed, mod2words[j]);
		}
		for(j = 0; j < mod3words.length; j++){
			stemming(mod3stemmed, mod3words[j]);
		}
		for(j = 0; j < mod4words.length; j++){
			stemming(mod4stemmed, mod4words[j]);
		}


		allmodquestions.push(originalmod1questions, originalmod2questions, originalmod3questions, originalmod4questions);
		allmodwords.push(mod1words, mod2words, mod3words, mod4words);
		allmodstemmed.push(mod1stemmed, mod2stemmed, mod3stemmed, mod4stemmed);

		for(i = 0; i < allmodquestions.length; i++){
			qpaperFinalData.push({questions: allmodquestions[i],
			           words: allmodwords[i],
					   stemmedWords: allmodstemmed[i]
					});
        }	
        qpaperFinalData = JSON.stringify(qpaperFinalData);
        localStorage.setItem("qpaperstring", qpaperFinalData);
	
	} // pattern type2 ends-------------------------------------------------------------------    


}

function two(){
    var qpaperstring = localStorage.getItem("qpaperstring");
    document.getElementById("finalData").innerHTML = qpaperstring;
}

function addSubject(){
	subject = document.getElementById("subnameAdd").value;
	return fetch("/admin/add/"+subject);
}

function removeSubject(){
	subject = document.getElementById("subnameRemove").value;
	return fetch("/admin/remove/"+subject);
}

function removeSubjectTuple(){
	subject = document.getElementById("subnameRemoveTuple").value;
	id = document.getElementById("subnameRemoveTupleId").value;
	return fetch("/admin/remove/"+subject+"/"+id);
}

function adminSubjects(){
    fetch("/admin/data").then(function(response){
        response.json().then(function(data){
            let optionHTML = "";
            for (let sub of data.subjects){
                optionHTML += '<option value="' + sub.name + '">' + sub.name + '</option>';
            }
			document.getElementById("subjects").innerHTML = optionHTML;			
        });
    });
}

function adminSubjectsRemove(){
    fetch("/admin/data").then(function(response){
        response.json().then(function(data){
            let optionHTML = "";
            for (let sub of data.subjects){
                optionHTML += '<option value="' + sub.name + '">' + sub.name + '</option>';
            }
			document.getElementById("subnameRemove").innerHTML = optionHTML;
        });
    });
}

function adminSubjectsRemoveTuple(){
    fetch("/admin/data").then(function(response){
        response.json().then(function(data){
            let optionHTML = "";
            for (let sub of data.subjects){
                optionHTML += '<option value="' + sub.name + '">' + sub.name + '</option>';
            }
			document.getElementById("subnameRemoveTuple").innerHTML = optionHTML;
        });
    });
}