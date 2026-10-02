# 🔒 SafeVault / Alavuddin Vault (காப்பறை)

> **Zero-Knowledge, 100% Offline, AES-256-GCM Encrypted Flat-File Secret Storage & Notepad Manager**

[![Build Android APK](https://github.com/shakilmunavary/safevault/actions/workflows/build-apk.yml/badge.svg)](https://github.com/shakilmunavary/safevault/actions/workflows/build-apk.yml)

---

## 🌟 Key Features

* **🪟 Windows 11 Explorer Interface**:
  * Hierarchical **Left Navigation Tree** showing folders and nested encrypted files.
  * **Draggable Split Divider** to easily adjust panel width on both mobile and laptop screens.
  * **Right Live Content Viewer & Fast Editor** with quick Copy, Edit, and Delete actions.
* **🛡️ Military-Grade Offline AES-256 Encryption**:
  * Powered by `PBKDF2` (10,000 rounds) + `AES-256-GCM` encryption.
  * **Zero Database**: Stored completely locally in sandboxed encrypted flat files (`safevault_secure_store.enc`).
* **🔑 Flexible Master Credentials**:
  * Supports alphanumeric master passwords (min 3 characters).
  * 2 Case-insensitive security recovery questions for password resets.
* **🎨 10 Selectable Themes**:
  * 🪟 Windows 11 Explorer (Fluent Light)
  * ⚪ Pure Snow White
  * 🌫️ Modern Slate Gray
  * 🧊 Sky Breeze Light Blue
  * 🌿 Pastel Mint Light
  * ☀️ Classic Light (Indigo)
  * 🌙 Cyber Dark
  * 🕌 Golden Palace (Aladdin)
  * 💎 Emerald Safe Dark
  * 🌌 Midnight Sapphire Dark
* **✍️ Rich Text & Photos**:
  * Quick format toolbars for bullet points, checklists, bold, code tags, and encrypted photo attachments.
* **📱 Android Notch & Navigation Safe Area**:
  * Top status bar clearance and bottom padding avoiding phone OS buttons.
  * Persistent **🏠 Home** button on all screens and modals.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start Expo Development Server
npx expo start --clear
```

Open `http://localhost:8081` in your browser or scan the QR code in **Expo Go**.

---

## 📦 Download Android APK

- **📥 Latest Release APK**: [Download `SafeVault-latest.apk`](https://raw.githubusercontent.com/shakilmunavary/safevault/main/apk/SafeVault-latest.apk)
- **📁 All Versions Folder**: [Browse `apk/` folder](https://github.com/shakilmunavary/safevault/tree/main/apk)
- **⚡ Automated Builds**: Every commit compiles and updates the APK automatically in [GitHub Actions](https://github.com/shakilmunavary/safevault/actions).

---

## 📄 License & Copyright

Copyright © 2026 Shakil Ahamed (`shakil.ahamed@gmail.com`). All rights reserved.  
Licensed under the [MIT License](LICENSE).
