import pandas as pd 
import yfinance as yf
import sqlite3
from flask import request, render_template, jsonify, g, Flask

app = Flask(__name__, template_folder = "templates")

DATABASE = 'database.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

def create_tables():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)")
        cursor.execute("CREATE TABLE IF NOT EXISTS stocks_held (id INTEGER PRIMARY KEY, user_id INTEGER, ticker TEXT, quantity INTEGER)")
        db.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = get_db()
    db.close()

#Flask Routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def loginPage():
    return render_template('login.html')

@app.route('/get_stock_data', methods = ['POST'])
def get_stock_data():
    ticker = request.get_json()['ticker']
    data = yf.Ticker(ticker).history(period='1y')
    return jsonify({'currentPrice' : data.iloc[-1].Close,
                   'openPrice': data.iloc[-1].Open})

@app.route('/register', methods = ['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        db.commit()
        return jsonify({'message': 'User registered successfully'})
    
@app.route('/login', methods=['POST'])
def login():

    data = request.get_json()
    username = data['username']
    password = data['password']
    with app.app_context():
            db = get_db()
            cursor = db.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
            user = cursor.fetchone()
            db.close()
            if user:
                return jsonify({'message': 'Login successful'})
            else:
                return jsonify({'message': 'Invalid username or password'})
            

if __name__== '__main__':
    create_tables()
    app.run(debug=True)

