# TeleDrive ☁️

**Unlimited cloud storage powered by Telegram**

TeleDrive is a modern cloud storage application that uses your Telegram account's "Saved Messages" as a storage backend. This means you get **unlimited free storage** for all your files!

🌐 **Try it now:** [https://teledrivecloudstorage.vercel.app/](https://teledrivecloudstorage.vercel.app/)

![TeleDrive Screenshot](https://img.shields.io/badge/Storage-Unlimited-green) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- 📁 **Unlimited Storage** - Store as many files as you want using Telegram's infrastructure
- 📂 **Folder Organization** - Create folders and organize your files
- 🖼️ **Image Gallery** - View images with navigation arrows (← →) to browse through your photos
- 🎬 **Video Player** - Watch videos directly in the app
- 📱 **Mobile Friendly** - PWA support, pinch-to-zoom, and touch gestures
- 🔄 **Drag & Drop** - Simply drag files to upload them
- 🔒 **Secure** - Your files are stored in your own Telegram account

---

## 🚀 Quick Start (Use Online)

The easiest way to use TeleDrive is through the hosted version:

1. Go to [https://teledrivecloudstorage.vercel.app/](https://teledrivecloudstorage.vercel.app/)
2. Enter your phone number (with country code, e.g., +1234567890)
3. Enter the verification code sent to your Telegram app
4. Start uploading files!

---

## 💻 Running Locally

If you want to run TeleDrive on your own computer, follow these steps:

### Prerequisites

Before you start, you need to install **Node.js** on your computer.

#### Step 1: Install Node.js

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS** version (the green button)
3. Run the installer
4. Click "Next" on everything until it's installed
5. Restart your computer

#### Step 2: Verify Node.js Installation

1. Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux)
   - On Windows: Press `Win + R`, type `cmd`, press Enter
2. Type the following command and press Enter:
   ```
   node --version
   ```
3. You should see something like `v20.10.0` (the number might be different)
4. If you see an error, restart your computer and try again

### Download and Run TeleDrive

#### Step 3: Download the Project

**Option A: Download as ZIP (Easier)**
1. Go to the GitHub repository page
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder (e.g., `C:\TeleDrive`)

**Option B: Using Git (For developers)**
```bash
git clone https://github.com/thecsa/TeleDrive.git
cd TeleDrive
```

#### Step 4: Open Command Prompt in the Project Folder

1. Open the folder where you extracted/cloned TeleDrive
2. Click on the address bar at the top of the folder window
3. Type `cmd` and press Enter
4. A black Command Prompt window will open

#### Step 5: Install Dependencies

In the Command Prompt window, type this command and press Enter:
```bash
npm install
```

**Wait for it to finish.** This might take 1-2 minutes. You'll see a lot of text scrolling. When it's done, you'll see the cursor blinking again.

#### Step 6: Start the Application

Type this command and press Enter:
```bash
npm run dev -- --port 5174
```

You should see something like:
```
VITE v6.x.x  ready in xxx ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

#### Step 7: Open TeleDrive

1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:5174**
3. You should see the TeleDrive login page!

### Alternative: Use the start.bat File (Windows Only)

If you're on Windows, you can simply:
1. Double-click the `start.bat` file in the project folder
2. The application will start and open in your browser automatically

---

## 📱 How to Use TeleDrive

### Logging In

1. Enter your phone number with country code (e.g., `+905551234567`)
2. Click "Send Code"
3. Open your Telegram app - you'll receive a verification code
4. Enter the code in TeleDrive
5. If you have 2FA enabled, enter your password

### Uploading Files

- **Drag & Drop:** Simply drag files from your computer and drop them into TeleDrive
- **Upload Button:** Click the upload button (↑) in the header

### Organizing Files

- **Create Folder:** Click the folder icon (📁) in the header
- **Move Files:** Drag a file and drop it onto a folder

### Viewing Files

- **Single Click:** Shows file preview in the side panel
- **Double Click:** Opens the file in full-screen viewer
- **Navigation:** Use left (←) and right (→) arrows to browse images/videos
- **Zoom:** Use mouse wheel or pinch gestures (mobile) to zoom

### Mobile Features

- **Pinch to Zoom:** Use two fingers to zoom in/out on images
- **Pan:** When zoomed in, drag with one finger to move around
- **Swipe Navigation:** Use arrow buttons to navigate between images

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Telegram API:** GramJS (MTProto)
- **Styling:** Custom CSS with CSS Variables
- **PWA:** Vite PWA Plugin

---

## ⚠️ Troubleshooting

### "npm is not recognized"
- Node.js is not installed properly
- Restart your computer and try again
- Reinstall Node.js from [https://nodejs.org/](https://nodejs.org/)

### "ENOENT: no such file or directory"
- Make sure you're in the correct folder
- The Command Prompt should show the TeleDrive folder path

### "Port 5174 is already in use"
- Another application is using this port
- Try a different port: `npm run dev -- --port 5175`

### Login Issues
- Make sure your phone number includes the country code (e.g., +1, +44, +90)
- Check your Telegram app for the verification code
- The code expires after a few minutes - request a new one if needed

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ using Telegram's awesome API
