from flask import Flask, request, jsonify, send_from_directory, session, render_template, redirect, url_for, flash
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import requests
import os
import time
import ssl
import certifi
import csv
import hashlib
import uuid
import re
import logging

# Suppress selenium and webdriver logs - keep backend silent
logging.getLogger('selenium').setLevel(logging.CRITICAL)
logging.getLogger('urllib3').setLevel(logging.CRITICAL)
logging.getLogger('WDM').setLevel(logging.CRITICAL)
os.environ['WDM_LOG'] = '0'
os.environ['WDM_LOG_LEVEL'] = '0'

# Fix SSL certificate issue
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['SSL_CERT_FILE'] = certifi.where()

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = 'rns-yt4-secret-key-2024-professional'

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
    """Open a native folder selection dialog"""
    try:
        import tkinter as tk
        from tkinter import filedialog
        
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        
        folder_path = filedialog.askdirectory(
            title='Select Download Folder',
            initialdir=os.path.expanduser('~')
        )
        
        root.destroy()
        
        if folder_path:
            return jsonify({'success': True, 'path': folder_path})
        else:
            return jsonify({'success': False, 'cancelled': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def get_chrome_options():
    """Get Chrome options configured for visible operation"""
    chrome_options = webdriver.ChromeOptions()
    
    # Visible window settings
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # User agent
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    return chrome_options

@app.route('/extract-playlist', methods=['POST'])
def extract_playlist():
    """Extract video links from playlist - runs completely in background"""
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
    
    driver = None
    try:
        chrome_options = get_chrome_options()
        
        service = Service(ChromeDriverManager().install())
        service.log_path = os.devnull  # Suppress service logs
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.get("https://nimtools.com/youtube-playlist-video-link-extractor")
        time.sleep(3)
        
        input_field = WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='text']"))
        )
        input_field.clear()
        input_field.send_keys(url)
        
        time.sleep(2)
        
        try:
            recaptcha_frame = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[title='reCAPTCHA']"))
            )
            driver.switch_to.frame(recaptcha_frame)
            checkbox = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CLASS_NAME, "recaptcha-checkbox-border"))
            )
            checkbox.click()
            driver.switch_to.default_content()
            time.sleep(3)
        except Exception as e:
            driver.switch_to.default_content()
        
        submit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='submit']"))
        )
        submit_button.click()
        time.sleep(5)
        
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.ID, "copyButton"))
            )
            
            video_links = []
            link_elements = driver.find_elements(By.XPATH, "//a[contains(@href, 'youtube.com/watch')]")
            for element in link_elements:
                href = element.get_attribute('href')
                if href and 'watch?v=' in href:
                    video_links.append(href)
            
            if not video_links:
                text_areas = driver.find_elements(By.TAG_NAME, "textarea")
                for ta in text_areas:
                    text_content = ta.get_attribute('value')
                    if text_content:
                        urls = re.findall(r'https://www\.youtube\.com/watch\?v=[^\s]+', text_content)
                        video_links.extend(urls)
            
            video_links = list(set(video_links))
            
            if video_links:
                videos = []
                for i, link in enumerate(video_links):
                    video_id = link.split('v=')[-1].split('&')[0] if 'v=' in link else f'video-{i}'
                    videos.append({
                        'id': video_id,
                        'url': link,
                        'title': f'Video {i + 1}',
                        'thumbnail': f'https://img.youtube.com/vi/{video_id}/mqdefault.jpg'
                    })
                
                if not is_logged_in:
                    session['guest_downloads'] = guest_downloads + 1
                
                return jsonify({
                    'success': True,
                    'videos': videos,
                    'count': len(videos)
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Could not extract video links. Please check if the playlist is public.'
                })
                
        except Exception as e:
            return jsonify({'success': False, 'error': f'Failed to extract links: {str(e)}'})
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if driver:
            driver.quit()

@app.route('/api/download', methods=['POST'])
def start_download():
    """Start downloading videos - all processing happens in background"""
    data = request.get_json()
    videos = data.get('videos', [])
    download_path = data.get('path', 'downloads')
    
    if not videos:
        return jsonify({'success': False, 'error': 'No videos to download'})
    
    task_id = str(uuid.uuid4())
    
    download_tasks[task_id] = {
        'status': 'starting',
        'progress': 0,
        'current_video': None,
        'current_video_title': None,
        'completed_videos': [],
        'failed_videos': [],
        'total': len(videos),
        'message': 'Initializing download...'
    }
    
    import threading
    thread = threading.Thread(target=process_downloads, args=(task_id, videos, download_path))
    thread.daemon = True
    thread.start()
    
    return jsonify({'success': True, 'task_id': task_id})

def process_downloads(task_id, videos, download_path):
    """Process downloads with visible browser"""
    os.makedirs(download_path, exist_ok=True)
    
    for i, video in enumerate(videos):
        video_id = video.get('id', f'video-{i}')
        video_url = video.get('url', '')
        video_title = video.get('title', f'Video {i + 1}')
        
        print(f"Starting download for: {video_title} ({video_url})")
        
        download_tasks[task_id]['current_video'] = video_id
        download_tasks[task_id]['current_video_title'] = video_title
        download_tasks[task_id]['status'] = 'downloading'
        download_tasks[task_id]['message'] = f'Processing {video_title}...'
        
        driver = None
        try:
            print("Initializing Chrome driver...")
            chrome_options = get_chrome_options()
            
            # Set download preferences
            prefs = {
                "download.default_directory": os.path.abspath(download_path),
                "download.prompt_for_download": False,
                "download.directory_upgrade": True,
                "safebrowsing.enabled": True
            }
            chrome_options.add_experimental_option("prefs", prefs)
            
            service = Service(ChromeDriverManager().install())
            # service.log_path = os.devnull  # Suppress service logs
            driver = webdriver.Chrome(service=service, options=chrome_options)
            
            # Navigate to downloader site
            print("Navigating to downloader site...")
            driver.get("https://turboscribe.ai/downloader/youtube/mp4")
            time.sleep(3)
            
            print("Submitting URL...")
            input_field = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.NAME, "url"))
            )
            input_field.clear()
            input_field.send_keys(video_url)
            
            download_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
            )
            download_button.click()
            time.sleep(5)
            
            print("Waiting for download link...")
            download_link = WebDriverWait(driver, 90).until(
                EC.presence_of_element_located((By.XPATH, 
                    "//a[contains(@class, 'dui-btn') and contains(., 'Download')] | " +
                    "//a[contains(@href, 'googlevideo.com')]"
                ))
            )
            
            video_download_url = download_link.get_attribute("href")
            print(f"Found download URL: {video_download_url[:50]}...")
            
            # Store current window handle
            main_window = driver.current_window_handle
            
            # Open link in new tab using JavaScript (Redirect to Chrome behavior)
            print("Opening in new tab...")
            driver.execute_script("window.open(arguments[0], '_blank');", video_download_url)
            time.sleep(4)
            
            # Switch to new tab if opened
            if len(driver.window_handles) > 1:
                driver.switch_to.window(driver.window_handles[-1])
                time.sleep(3)
                
                # Try to get video source from the new tab
                try:
                    video_element = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.TAG_NAME, "video"))
                    )
                    video_src = video_element.get_attribute("src")
                    if video_src and 'googlevideo.com' in video_src:
                        video_download_url = video_src
                    
                    # Trigger download using JavaScript
                    print("Triggering browser download...")
                    driver.execute_script("""
                        var link = document.createElement('a');
                        link.href = arguments[0];
                        link.download = arguments[1];
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    """, video_download_url, f"web_{video_id}.mp4")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Video element error: {e}")
                
                # Close the new tab and switch back
                driver.close()
                driver.switch_to.window(main_window)
            
            session_req = requests.Session()
            session_req.verify = certifi.where()
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Referer': 'https://www.youtube.com/'
            }
            
            download_tasks[task_id]['message'] = f'Downloading {video_title}...'
            print("Starting server-side download...")
            
            response = session_req.get(video_download_url, stream=True, timeout=300, headers=headers)
            response.raise_for_status()
            
            filename = f"{video_id}.mp4"
            filepath = os.path.join(download_path, filename)
            
            # Get file size for progress tracking
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            file_progress = int((downloaded / total_size) * 100)
                            download_tasks[task_id]['file_progress'] = file_progress
            
            print(f"Download completed: {filename}")
            download_tasks[task_id]['completed_videos'].append(video_id)
            download_tasks[task_id]['message'] = f'Completed {video_title}'
            
        except Exception as e:
            print(f"Error downloading {video_title}: {str(e)}")
            download_tasks[task_id]['failed_videos'].append(video_id)
            download_tasks[task_id]['message'] = f'Failed to download {video_title}'
        finally:
            if driver:
                driver.quit()
        
        completed = len(download_tasks[task_id]['completed_videos'])
        failed = len(download_tasks[task_id]['failed_videos'])
        download_tasks[task_id]['progress'] = int(((completed + failed) / len(videos)) * 100)
        download_tasks[task_id]['file_progress'] = 0
    
    download_tasks[task_id]['status'] = 'completed'
    download_tasks[task_id]['progress'] = 100
    download_tasks[task_id]['current_video'] = None
    download_tasks[task_id]['message'] = 'All downloads completed'

@app.route('/download-progress/<task_id>')
def download_progress(task_id):
    """Get download progress"""
    if task_id not in download_tasks:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(download_tasks[task_id])

@app.route('/static/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    init_users_csv()
    print("=" * 50)
    print("  RNS YT4 - YouTube Playlist Downloader")
    print("  Open http://127.0.0.1:5000 in your browser")
    print("=" * 50)
    app.run(debug=True, threaded=True)