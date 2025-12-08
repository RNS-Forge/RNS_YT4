import requests
import json
import time

url = "http://127.0.0.1:5000/api/download"
data = {
    "videos": [
        {
            "id": "test_video",
            "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "title": "Test Video"
        }
    ],
    "path": "downloads"
}

try:
    print("Sending download request...")
    response = requests.post(url, json=data)
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        task_id = response.json().get('task_id')
        print(f"Task ID: {task_id}")
        
        while True:
            progress_url = f"http://127.0.0.1:5000/download-progress/{task_id}"
            prog_response = requests.get(progress_url)
            prog_data = prog_response.json()
            print(f"Progress: {prog_data.get('status')} - {prog_data.get('message')}")
            
            if prog_data.get('status') in ['completed', 'error']:
                break
            
            time.sleep(2)
            
except Exception as e:
    print(f"Error: {e}")
