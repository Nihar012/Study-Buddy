document.getElementById("inputForm2").onload = subjects2();

function subjects2(){
    fetch("/public/subjects").then(function(response){
        response.json().then(function(data){
            let optionHTML = "";
            for (let sub of data.subjects){
                optionHTML += '<option value="' + sub.name + '">' + sub.name + '</option>';
            }
			document.getElementById("subjects2").innerHTML = optionHTML;			
        });
    });
}

document.getElementById("subjects2").onchange = function(){
	subject = document.getElementById("subjects2").value;
	static = "static";
	file = "'images/icons/ddg.png'";
	fetch("/public/qpapers/"+ subject).then(function(response){
		response.json().then(function(data){
			let cardsHTML = "";
			for (let qpaper of data.qpapers){
				cardsHTML += '<div class="col mb-4"><div class="card" style="width: 18rem;"><img src="/static/images/icons/ddg.png" class="card-img-top" alt="..."><div class="card-img-overlay"><h5 class="card-title">'+ qpaper.name +'</h5><a href="/download/'+ qpaper.filename +'"><button class="btn btn-primary download-button">Download</button></a></div></div></div>';
			    // cardsHTML += '<option value="' + qpaper.id + '">' + qpaper.name + '</option>';
			}
			document.getElementById("qpapercards").innerHTML = cardsHTML;
		});
	});
}

function viewpdf(filename){
	viewer = $('#viewpdf');
	PDFObject.embed(filename, viewer);
}

