# Stealth Webcam Access & Google Drive Uploader

A browser-based project that records a short webcam clip, captures device info, and securely uploads it to Google Drive. Uses Google OAuth 2.0 for authentication.

## Features
- Access user webcam & microphone
- Capture device info (browser, platform, screen resolution, timezone)
- Upload recording to Google Drive automatically
- Generates a public link (hidden from UI)
- Lightweight, front-end only (no server required)

## Setup
1. Create a Google Cloud OAuth Client ID (Web application)
2. Add your domain to **Authorized JavaScript origins**
3. Enable Google Drive API
4. Update `CLIENT_ID` and `FOLDER_ID` in `script.js`
5. Deploy on any static hosting (e.g., Netlify)

## Usage
- Open the page → allow camera & microphone → recording starts automatically
- Device info & video stored in localStorage
- Video uploaded to Google Drive with public link logged in console

## Security Notes
- No `client_secret` in front-end
- OAuth token only requests minimal scope: `https://www.googleapis.com/auth/drive.file`
- Data stored in browser only until uploaded
