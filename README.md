# Dark Mode Everywhere  

## About  
Dark Mode Everywhere is a Chrome extension that forces dark mode on all websites, even those without built-in themes. It helps reduce eye strain and creates a consistent, comfortable browsing experience — perfect for students, developers, and night readers.  

---

## Architecture  
The extension follows a simple Chrome Extension structure:  

- **`manifest.json`** → Defines extension metadata, permissions, and entry points.  
- **Popup (`popup.html` + `popup.js`)** → Small UI for toggling dark mode.  
- **Content Script (`content.js`)** → Injected into websites to apply CSS filters for dark mode.  
- **Chrome Storage API** → Saves your dark mode preference across sessions.  

**Flow:**  
1. User clicks the toolbar icon.  
2. Popup sends a message to the content script.  
3. Content script applies or removes dark mode CSS.  
4. User preference is stored for the next visit.  

---

## Why It’s Useful  
- Works on all websites  
- Lightweight and fast  
- Saves your preference automatically  
- Reduces eye strain during late-night browsing  

---

## License  
MIT License — free to use and modify.  

---

## Connect With Me  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Abdullah%20Moghal-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/abdullahmoghal)  
[![Email](https://img.shields.io/badge/Email-amm0640%40mavs.uta.edu-red?logo=gmail&logoColor=white)](mailto:amm0640@mavs.uta.edu)  
