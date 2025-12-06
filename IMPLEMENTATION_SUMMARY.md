

## 🎯 Key Features for Judges

1. **FTSO Integration:**
   - Real-time price from Flare oracle
   - Stored on-chain at prediction creation
   - Visible in UI with "Powered by Flare" badge

2. **FXRP Staking:**
   - Uses FAsset (FXRP) as staking token
   - Requires real token transfer
   - Shows economic commitment

3. **AI + Web Scraping:**
   - Scrapes supporting URLs
   - Analyzes sentiment and credibility
   - Combines into validation score

4. **End-to-End Flow:**
   - All features work together
   - Graceful error handling
   - Production-ready architecture

---

## 📝 Notes

- All code is well-commented
- Error handling is comprehensive
- Fallback mechanisms in place
- Demo-ready with mock data support
- Easy to extend with real FTSO addresses

---

## 🐛 Common Issues

1. **"FTSO contract not set"** → Set FTSO addresses via `setFTSOContract()`
2. **"Network not connected"** → Click "Switch to Flare Coston2"
3. **"Scraping failed"** → Check URL accessibility or proceed without URL
4. **"API key missing"** → Set OPENAI_API_KEY in backend .env

---

**Ready for Hackathon Demo! 🚀**

