from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS

from api import url_analyzer
from api import password_analyzer
from api import email_analyzer
from api import chatbot
from api import breach_checker

app = Flask(__name__)
CORS(app)

app.secret_key = 'super_secret_cyber_key'

@app.before_request
def require_login():
    allowed_routes = ['login', 'static']
    if request.endpoint not in allowed_routes and not session.get('logged_in'):
        return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        session['logged_in'] = True
        return redirect(url_for('index'))
    return render_template('auth.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze-url', methods=['POST'])
def analyze_url():
    data = request.json
    if not data or 'url' not in data:
        return jsonify({'error': 'Missing URL'}), 400
    result = url_analyzer.analyze(data['url'])
    return jsonify(result)

@app.route('/api/analyze-password', methods=['POST'])
def analyze_password():
    data = request.json
    if not data or 'password' not in data:
        return jsonify({'error': 'Missing password'}), 400
    result = password_analyzer.analyze(data['password'])
    return jsonify(result)

@app.route('/api/analyze-email', methods=['POST'])
def analyze_email():
    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing text'}), 400
    result = email_analyzer.analyze(data['text'])
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'Missing message'}), 400
    result = chatbot.respond(data['message'])
    return jsonify(result)

@app.route('/api/check-breach', methods=['POST'])
def check_breach():
    data = request.json
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing email'}), 400
    result = breach_checker.check(data['email'])
    return jsonify(result)

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    import json
    import os
    
    # Read the mock database to determine real counts instead of random numbers
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'mock_breaches.json')
    try:
        with open(data_path, 'r') as f:
            breaches_data = json.load(f)
            # Count the total unique emails compromised
            threats = sum(len(b.get('emails', [])) for b in breaches_data)
            breach_count = len(breaches_data)
    except Exception:
        threats = 0
        breach_count = 0

    return jsonify({
        'total_scans': breach_count,
        'threats_detected': threats,
        'risk_score': min(100, threats * 5),
        'recent_activity': [
            {'action': 'URL Scan', 'status': 'Safe', 'time': 'Just now'},
            {'action': 'Password Check', 'status': 'Weak', 'time': '2 mins ago'},
            {'action': 'Email Analysis', 'status': 'Phishing', 'time': '5 mins ago'},
            {'action': 'Breach Check', 'status': f'Found {breach_count}', 'time': '12 mins ago'}
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5555)
