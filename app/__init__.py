from flask import Flask

app = Flask(__name__)

app.secret_key = "thisissecret"

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'root'
app.config['MYSQL_DB'] = 'flaskapp'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

app.config['FILES'] = 'C:/Users/Nihar/Desktop/Study Buddy/app/static/files'



from app import public_views