from app import app
from flask import render_template, request, redirect, jsonify, json, url_for, session, send_from_directory, abort
import pytesseract
import operator
from nltk.tokenize import word_tokenize
from PIL import Image
import os
import cv2
import numpy as np
from flask_mysqldb import MySQL

mysql = MySQL(app)

def apply_threshold(img, argument):
    switcher = {
         
        4: cv2.threshold(cv2.GaussianBlur(img, (3, 3), 0), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
        3: cv2.threshold(cv2.bilateralFilter(img,5,75,75), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
                
    }
    return switcher.get(argument, "Invalid method")


def edit_image(img_path, method):
    # Read image using opencv
    img = cv2.imread(img_path)

    # Create a directory for outputs
    output_path = ('C:/Users/Nihar/Desktop/Study Buddy/app/static/images/temp/')
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    # Rescale the image, if needed.
    img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    # Convert to gray
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply dilation and erosion to remove some noise
    kernel = np.ones((1, 1), np.uint8)
    img = cv2.dilate(img, kernel, iterations=1)
    img = cv2.erode(img, kernel, iterations=1)

    img = apply_threshold(img, method)
    
    # Save the filtered image in the output directory    
    save_path = os.path.join(output_path, 'qpapertemp.png')
    cv2.imwrite(save_path, img)

    img = Image.open(save_path)
    
    return img.save(save_path, dpi=(300, 300))







@app.route("/")
def startPage():
    return redirect(url_for("topicScoreUserInput"));

@app.route("/topicscore", methods=["GET", "POST"])
def topicScoreUserInput():
    if request.method == "POST":
        subject = request.form["subjects"]
        qpapersid = request.form.getlist("qpapers")
        syllabusImage = request.files["syllabusImage"]
        temp = Image.open(syllabusImage)
        syllabus = pytesseract.image_to_string(temp)
        tokenizedSyllabus = word_tokenize(syllabus)
        
        qpapersarray = []
        cur = mysql.connection.cursor()
        for qpaperid in qpapersid:
            cur.execute("SELECT * FROM "+subject+" WHERE id="+qpaperid)
            mysql.connection.commit()
            qpapers = cur.fetchall()                        
            for qpaper in qpapers:
                qpapersarray.append(json.loads(qpaper["data"]))
        

        return render_template("public/topicscore.html", qpaperdata=qpapersarray, tokenizedSyllabus=tokenizedSyllabus)

    return render_template("public/userinput.html")


@app.route("/generateqbank", methods=["GET", "POST"])
def generateQbankUserInput():
    if request.method == "POST":
        subject = request.form["subjects"]
        qpapersid = request.form.getlist("qpapers")
        syllabusImage = request.files["syllabusImage"]
        temp = Image.open(syllabusImage)
        syllabus = pytesseract.image_to_string(temp)
        tokenizedSyllabus = word_tokenize(syllabus)
        
        qpapersarray = []
        cur = mysql.connection.cursor()
        for qpaperid in qpapersid:
            cur.execute("SELECT * FROM "+subject+" WHERE id="+qpaperid)
            mysql.connection.commit()
            qpapers = cur.fetchall()                        
            for qpaper in qpapers:
                qpapersarray.append(json.loads(qpaper["data"]))
        

        return render_template("public/qbankgen.html", qpaperdata=qpapersarray, tokenizedSyllabus=tokenizedSyllabus)

    return render_template("public/userinputqbank.html")

@app.route("/help")
def help():
    return render_template("public/help.html")
    
@app.route("/downloadqpapers")
def downloadqpapers():
    return render_template("public/qpaperdownload.html")


@app.route("/download/<filename>")
def download(filename):
    return send_from_directory(app.config['FILES'], filename=filename, as_attachment=True)


@app.route("/view/<filename>")
def view(filename):
    return render_template("public/index.html", filename=filename)


@app.route("/public/subjects")
def publicSubjects():
    cur = mysql.connection.cursor()
    cur.execute("SHOW TABLES")
    mysql.connection.commit()
    subjects = cur.fetchall()
    cur.close()
    subarray = []
    for sub in subjects:
        subObj = {}
        subObj["name"] = sub["Tables_in_flaskapp"]
        subarray.append(subObj)
    
    subarray.remove(subarray[0])

    return jsonify({'subjects' : subarray})


@app.route("/public/qpapers/<subject>")
def publicQpapers(subject):
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM "+subject)
    mysql.connection.commit()
    qpapers = cur.fetchall()
    cur.close()
    qpapersarray = []
    for qpaper in qpapers:
        qpaperObj = {}
        qpaperObj["id"] = qpaper["id"]
        qpaperObj["name"] = qpaper["name"]
        qpaperObj["filename"] = qpaper["filename"]
        qpapersarray.append(qpaperObj)
        print(qpaperObj["filename"])

    return jsonify({'qpapers' : qpapersarray})










































@app.route("/admin/login", methods=["GET", "POST"])
def login():
    msg = ''
    if request.method == "POST" and 'username' in request.form and 'password' in request.form:
        username = request.form["username"]
        password = request.form["password"]
        cur = mysql.connection.cursor()
        cur.execute("SELECT * FROM accounts WHERE username = %s AND password = %s",(username, password))
        mysql.connection.commit()
        account = cur.fetchone()
        cur.close()

        if account:
            session["loggedin"] = True
            session["id"] = account["id"]
            session["username"] = account["username"]
            return redirect(url_for("adminhome"))
        else:
            msg = 'Incorrect username/password!'

    return render_template("admin/login.html", msg = msg)


@app.route("/admin/logout")
def logout():
    session.pop("loggedin", None)
    session.pop("id", None)
    session.pop("username", None)

    return redirect(url_for("login"))


@app.route("/admin/adminhome", methods=["GET", "POST"])
def adminhome():
    if "loggedin" in session:
        return render_template("admin/adminhome.html")
    
    return redirect(url_for("login"))


@app.route("/admin/addqpaper", methods=["GET", "POST"])
def addqpaper():
    if "loggedin" in session:
        if request.method == "POST":
            qpaperImage = request.files["qpaperImage"]
            qpaperImage = Image.open(qpaperImage)
            qpaperImage.save("C:/Users/Nihar/Desktop/Study Buddy/app/static/images/temp/qpapertemp.png")
            
            edit_image("C:/Users/Nihar/Desktop/Study Buddy/app/static/images/temp/qpapertemp.png", 3)            
            
            qpimage = Image.open("C:/Users/Nihar/Desktop/Study Buddy/app/static/images/temp/qpapertemp.png")
            qpaperData = pytesseract.image_to_string(qpimage, lang="eng")
            return render_template("admin/addqpaper2.html", qpaperData = qpaperData)

        return render_template("admin/addqpaper.html")

    return redirect(url_for("login"))


@app.route("/admin/addqpaper3", methods=["GET", "POST"])
def addqpaper3():
    if request.method == "POST":
        subject = request.form["subjects"]
        qpapername = request.form["qpapername"]
        patternType = request.form["patternType"]
        # qpaperfile = request.files["qpaperfile"]
        # filename = qpapername+"("+patternType+").pdf"
        filename = "file"
        finalData = request.form["finalData"]
        cur = mysql.connection.cursor()
        cur.execute("INSERT INTO "+subject+"(name, pattern, data, filename) VALUES(%s, %s, %s, %s)", (qpapername, patternType, finalData, filename))
        mysql.connection.commit()
        cur.close()
        # qpaperfile.save(os.path.join(app.config['FILES'], filename))
        return render_template("admin/addqpaper3.html")

    return render_template("admin/addqpaper3.html")


@app.route("/admin/data")
def admindata():
    if "loggedin" in session:
        cur = mysql.connection.cursor()
        cur.execute("SHOW TABLES")
        mysql.connection.commit()
        subjects = cur.fetchall()
        cur.close()
        subarray = []
        for sub in subjects:
            subObj = {}
            subObj["name"] = sub["Tables_in_flaskapp"]
            subarray.append(subObj)

        subarray.remove(subarray[0])

        return jsonify({'subjects' : subarray})

    return redirect(url_for("login"))


@app.route("/admin/add/<subject>")
def addsubject(subject):
    if "loggedin" in session:
        cur = mysql.connection.cursor()
        cur.execute("CREATE TABLE "+subject+"(id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,name varchar(50) NOT NULL,pattern varchar(10) NOT NULL,data text,filename varchar(50) NOT NULL)")
        mysql.connection.commit()
        cur.close()
        return render_template("admin/adminhome.html")

    return redirect(url_for("login"))


@app.route("/admin/remove/<subject>")
def removesubject(subject):
    if "loggedin" in session:
        cur = mysql.connection.cursor()
        cur.execute("DROP TABLE "+subject)
        mysql.connection.commit()
        cur.close()
        return render_template("admin/adminhome.html")

    return redirect(url_for("login"))


@app.route("/admin/remove/<subject>/<id>")
def removesubjecttuple(subject,id):
    if "loggedin" in session:
        cur = mysql.connection.cursor()
        cur.execute("DELETE FROM "+subject+" WHERE id="+id)
        mysql.connection.commit()
        cur.close()
        return render_template("admin/adminhome.html")

    return redirect(url_for("login"))
