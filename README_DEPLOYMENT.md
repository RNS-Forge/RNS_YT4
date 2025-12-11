# RNS YT4 - YouTube Playlist Downloader

A modern web application for managing YouTube playlist downloads with user authentication and smart features.

## Features

- 🎯 User Authentication (Login/Signup)
- 📊 Download Tracking & Statistics
- 🎨 Modern UI with Animations
- 🔒 Secure Session Management
- 📱 Responsive Design

## Deployment on Render

### Prerequisites
- GitHub account
- Render account (free tier available)

### Quick Deploy Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect settings from `render.yaml`
   - Click "Create Web Service"

3. **Environment Variables (Optional)**
   - `SECRET_KEY`: Auto-generated for sessions
   - `DEBUG`: Set to `False` for production
   - `PORT`: Auto-detected by Render

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py
```

Visit `http://127.0.0.1:5000`

## Project Structure

```
RNS_YT4/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── Procfile              # Gunicorn configuration
├── render.yaml           # Render deployment config
├── runtime.txt           # Python version
├── templates/            # HTML templates
│   ├── base.html
│   ├── home.html
│   ├── login.html
│   ├── signup.html
│   ├── download.html
│   ├── features.html
│   └── about.html
├── static/              # Static assets
│   ├── css/
│   ├── js/
│   └── images/
└── store/               # User data storage
    └── users.csv
```

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Deployment**: Render.com
- **Server**: Gunicorn

## Important Notes for Hosted Version

- **Download Functionality**: Due to server limitations on Render's free tier, video downloads work through:
  - Manual URL copying
  - Browser extensions
  - Third-party download tools
- **File Storage**: Not persistent on Render free tier
- **Selenium**: Removed for deployment (requires Chrome/ChromeDriver)

## License

All rights reserved © RNS Solutions

## Support

For issues or questions, please open an issue on GitHub.
