from flask import Flask, request, jsonify, send_from_directory
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
from pathlib import Path

# Fix SSL certificate issue
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['SSL_CERT_FILE'] = certifi.where()

app = Flask(__name__)

# Store download progress
download_progress = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

@app.route('/download', methods=['POST'])
def download():
    data = request.get_json()
    urls = data.get('urls', [])
    download_path = data.get('downloadPath', 'downloads')
    results = []
    
    # Ensure download directory exists
    os.makedirs(download_path, exist_ok=True)
    
    # Setup Chrome options with download preferences
    chrome_options = webdriver.ChromeOptions()
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    # Set download preferences
    prefs = {
        "download.default_directory": os.path.abspath(download_path),
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing.enabled": True
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    for idx, url in enumerate(urls):
        driver = None
        try:
            # Initialize driver for each URL
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            driver.get("https://turboscribe.ai/downloader/youtube/mp4")
            
            # Wait for page to load
            time.sleep(3)
            
            # Find input field by name attribute
            input_field = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.NAME, "url"))
            )
            input_field.clear()
            input_field.send_keys(url)
            
            # Find and click submit button
            download_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
            )
            download_button.click()
            
            # Wait for the download button to appear (the blue DOWNLOAD button)
            time.sleep(5)
            
            # Find the DOWNLOAD link that contains the video URL
            download_link = WebDriverWait(driver, 90).until(
                EC.presence_of_element_located((By.XPATH, 
                    "//a[contains(@class, 'dui-btn') and contains(., 'Download')] | " +
                    "//a[contains(@href, 'googlevideo.com')]"
                ))
            )
            
            # Get the href which contains the googlevideo.com URL
            video_url = download_link.get_attribute("href")
            
            # Store current window handle
            main_window = driver.current_window_handle
            
            # Open link in new tab using JavaScript
            driver.execute_script("window.open(arguments[0], '_blank');", video_url)
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
                        video_url = video_src
                    
                    # Trigger download using JavaScript
                    driver.execute_script("""
                        var link = document.createElement('a');
                        link.href = arguments[0];
                        link.download = arguments[1];
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    """, video_url, f"video_{idx}.mp4")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Video element error: {e}")
                
                # Close the new tab and switch back
                driver.close()
                driver.switch_to.window(main_window)
            
            # Download the video file with progress tracking
            session = requests.Session()
            session.verify = certifi.where()
            
            # Set headers to mimic a browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity;q=1, *;q=0',
                'Range': 'bytes=0-',
                'Referer': 'https://www.youtube.com/'
            }
            
            response = session.get(video_url, stream=True, timeout=300, headers=headers)
            response.raise_for_status()
            
            # Extract video ID for filename
            video_id = url.split('v=')[-1].split('&')[0]
            filename = f"{video_id}.mp4"
            filepath = os.path.join(download_path, filename)
            
            # Download with progress tracking
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Calculate progress
                        if total_size > 0:
                            progress = (downloaded / total_size) * 100
                            download_progress[video_id] = {
                                'downloaded': downloaded,
                                'total': total_size,
                                'progress': round(progress, 2)
                            }
            
            # Verify download
            if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                file_size = os.path.getsize(filepath)
                results.append({
                    'url': url,
                    'status': 'downloaded',
                    'file': filename,
                    'size': f"{file_size / (1024*1024):.2f} MB",
                    'location': os.path.abspath(filepath),
                    'verified': True
                })
            else:
                results.append({
                    'url': url,
                    'status': 'failed',
                    'error': 'Download verification failed',
                    'verified': False
                })
            
        except Exception as e:
            results.append({
                'url': url,
                'status': 'failed',
                'error': str(e),
                'verified': False
            })
        finally:
            if driver:
                driver.quit()
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)