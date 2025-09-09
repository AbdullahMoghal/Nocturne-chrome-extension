# Nocturne  

## About  
Nocturne is a Chrome extension that lets you apply **custom themes** to all websites — not just dark mode. You can choose dark, light, sepia, or your own background and text colors to personalize your browsing. It helps reduce eye strain and creates a consistent, comfortable browsing experience — perfect for students, developers, and night readers.  

---

## Architecture  
The extension follows a simple Chrome Extension structure:  

- **`manifest.json`** → Defines extension metadata, permissions, and entry points.  
- **Popup (`popup.html` + `popup.js`)** → Small UI for toggling dark mode or selecting custom colors.  
- **Content Script (`content.js`)** → Injected into websites to apply CSS filters and theme rules.  
- **Chrome Storage API** → Saves your theme preferences across sessions.  

**Flow:**  
1. User clicks the toolbar icon.  
2. Popup sends a message with the selected theme to the content script.  
3. Content script applies background/text color rules.  
4. User preference is stored for the next visit.  

---

## Why It’s Useful  
- Works on all websites  
- Not limited to dark mode → choose any color scheme  
- Lightweight and fast  
- Saves your preferences automatically  
- Reduces eye strain and personalizes browsing  

---

## License  
MIT License — free to use and modify.  

---

## Connect With Me  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Abdullah%20Moghal-blue?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/abdullahmoghal)  
[![Email](https://img.shields.io/badge/Email-amm0640%40mavs.uta.edu-red?logo=gmail&logoColor=white)](mailto:amm0640@mavs.uta.edu)  
