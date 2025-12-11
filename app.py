from flask import Flask, request, jsonify, send_from_directory, session, render_template, redirect, url_for, flash
import requests
import os
import time
import certifi
import csv
import hashlib
import uuid
import re
import logging

# Suppress logs
logging.getLogger('urllib3').setLevel(logging.CRITICAL)

# Fix SSL certificate issue
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['SSL_CERT_FILE'] = certifi.where()

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = os.environ.get('SECRET_KEY', 'rns-yt4-secret-key-2024-professional')

# Ensure store directory exists
STORE_DIR = os.path.join(os.path.dirname(__file__), 'store')
os.makedirs(STORE_DIR, exist_ok=True)

# Users CSV file
USERS_FILE = os.path.join(STORE_DIR, 'users.csv')

# Store download tasks
download_tasks = {}

# ==========================================
# CSV USER MANAGEMENT
# ==========================================

def init_users_csv():
    """Initialize users CSV file with headers if it doesn't exist"""
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['email', 'username', 'password_hash', 'created_at', 'downloads_count'])

def load_users():
    """Load all users from CSV file"""
    init_users_csv()
    users = {}
    try:
        with open(USERS_FILE, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                users[row['email']] = {
                    'email': row['email'],
                    'username': row['username'],
                    'password_hash': row['password_hash'],
                    'created_at': row.get('created_at', ''),
                    'downloads_count': int(row.get('downloads_count', 0))
                }
    except Exception as e:
        print(f"Error loading users: {e}")
    return users

def save_user(email, username, password_hash):
    """Save a new user to CSV file"""
    init_users_csv()
    with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([email, username, password_hash, time.strftime('%Y-%m-%d %H:%M:%S'), 0])

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

# ==========================================
# PAGE ROUTES
# ==========================================

@app.route('/')
def home():
    """Landing page"""
    return render_template('home.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and handler"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        if not email or not password:
            flash('Please fill in all fields', 'error')
            return render_template('login.html')
        
        users = load_users()
        
        if email not in users:
            flash('Account not found', 'error')
            return render_template('login.html')
        
        if users[email]['password_hash'] != hash_password(password):
            flash('Invalid password', 'error')
            return render_template('login.html')
        
        session['user'] = {
            'email': email,
            'username': users[email]['username']
        }
        session['logged_in'] = True
        
        flash('Welcome back, ' + users[email]['username'], 'success')
        return redirect(url_for('download_page'))
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """Signup page and handler"""
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not username or not email or not password:
            flash('Please fill in all fields', 'error')
            return render_template('signup.html')
        
        if len(username) < 3:
            flash('Username must be at least 3 characters', 'error')
            return render_template('signup.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters', 'error')
            return render_template('signup.html')
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('signup.html')
        
        users = load_users()
        
        if email in users:
            flash('Email already registered', 'error')
            return render_template('signup.html')
        
        save_user(email, username, hash_password(password))
        
        flash('Account created successfully. Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('home'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """Forgot password page"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        
        if not email:
            flash('Please enter your email address', 'error')
            return render_template('forgot_password.html')
        
        users = load_users()
        
        if email in users:
            flash('Password reset instructions have been sent to your email', 'success')
        else:
            flash('Email not found in our system', 'error')
        
        return render_template('forgot_password.html')
    
    return render_template('forgot_password.html')

@app.route('/download')
def download_page():
    """Download page"""
    is_logged_in = session.get('logged_in', False)
    user = session.get('user', None)
    guest_downloads = session.get('guest_downloads', 0)
    
    return render_template('download.html', 
                         is_logged_in=is_logged_in, 
                         user=user,
                         guest_downloads=guest_downloads)

@app.route('/features')
def features():
    """Features page"""
    return render_template('features.html')

@app.route('/about')
def about():
    """About page"""
    return render_template('about.html')

@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools_config():
    """Handle Chrome DevTools config request"""
    return jsonify({}), 200

# ==========================================
# API ROUTES - Authentication
# ==========================================

@app.route('/api/login', methods=['POST'])
def api_login():
    """API endpoint for AJAX login"""
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'success': False, 'error': 'Please fill in all fields'})
    
    users = load_users()
    
    if email not in users:
        return jsonify({'success': False, 'error': 'Account not found'})
    
    if users[email]['password_hash'] != hash_password(password):
        return jsonify({'success': False, 'error': 'Invalid password'})
    
    session['user'] = {
        'email': email,
        'username': users[email]['username']
    }
    session['logged_in'] = True
    
    return jsonify({
        'success': True,
        'user': {
            'email': email,
            'username': users[email]['username']
        }
    })

@app.route('/api/signup', methods=['POST'])
def api_signup():
    """API endpoint for AJAX signup"""
    data = request.get_json()
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    
    if not username or not email or not password:
        return jsonify({'success': False, 'error': 'Please fill in all fields'})
    
    if len(username) < 3:
        return jsonify({'success': False, 'error': 'Username must be at least 3 characters'})
    
    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'})
    
    if password != confirm_password:
        return jsonify({'success': False, 'error': 'Passwords do not match'})
    
    users = load_users()
    
    if email in users:
        return jsonify({'success': False, 'error': 'Email already registered'})
    
    # Check if username exists
    for user_email, user_data in users.items():
        if user_data['username'].lower() == username.lower():
            return jsonify({'success': False, 'error': 'Username already taken'})
    
    # Save user
    save_user(email, username, hash_password(password))
    
    # Auto login after signup
    session['user'] = {
        'email': email,
        'username': username
    }
    session['logged_in'] = True
    
    return jsonify({
        'success': True,
        'user': {
            'email': email,
            'username': username
        }
    })

# ==========================================
# API ROUTES - File Operations
# ==========================================

@app.route('/browse-folder', methods=['POST'])
def browse_folder():
    """Return default download folder (client-side handling)"""
    return jsonify({'success': True, 'path': 'downloads', 'message': 'Downloads will be saved to your browser\'s download folder'})



@app.route('/extract-playlist', methods=['POST'])
def extract_playlist():
    """Extract video links from playlist URL using YouTube API pattern"""
    data = request.get_json()
    url = data.get('url', '')
    
    if not url:
        return jsonify({'error': 'No playlist URL provided'}), 400
    
    is_logged_in = session.get('logged_in', False)
    guest_downloads = session.get('guest_downloads', 0)
    
    if not is_logged_in and guest_downloads >= 1:
        return jsonify({
            'error': 'Guest users can only download 1 playlist. Please login for unlimited downloads.',
            'require_login': True
        }), 403
    
    try:
        # Extract playlist ID
        playlist_id = None
        if 'list=' in url:
            playlist_id = url.split('list=')[1].split('&')[0]
        
        if not playlist_id:
            return jsonify({'success': False, 'error': 'Invalid playlist URL'})
        
        # For deployment: Return instructions for client-side extraction
        # In production, you would use YouTube Data API v3 here with an API key
        videos = []
        
        # Simulated response - in production, replace with actual API call
        return jsonify({
            'success': False,
            'error': 'Server-side extraction not available on hosted version. Please use manual download with individual video URLs.',
            'playlist_id': playlist_id,
            'suggestion': 'Enter video URLs manually in the Manual Selection tab'
        })
                
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/download', methods=['POST'])
def start_download():
    """Generate download links for client-side downloading"""
    data = request.get_json()
    videos = data.get('videos', [])
    
    if not videos:
        return jsonify({'success': False, 'error': 'No videos to download'})
    
    # Prepare download information for client-side handling
    download_info = []
    for video in videos:
        download_info.append({
            'id': video.get('id'),
            'url': video.get('url'),
            'title': video.get('title'),
            'thumbnail': video.get('thumbnail'),
            'download_url': f"https://www.youtube.com/watch?v={video.get('id')}"
        })
    
    return jsonify({
        'success': True,
        'message': 'Please use a browser extension or third-party tool to download from YouTube URLs',
        'videos': download_info,
        'instruction': 'Right-click on video URLs and use your preferred download method'
    })



@app.route('/download-progress/<task_id>')
def download_progress(task_id):
    """Get download progress - not applicable for client-side downloads"""
    return jsonify({'error': 'Server-side downloads not available on hosted version'}), 404

@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    init_users_csv()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print("=" * 50)
    print("  RNS YT4 - YouTube Playlist Downloader")
    if debug:
        print(f"  Open http://127.0.0.1:{port} in your browser")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)