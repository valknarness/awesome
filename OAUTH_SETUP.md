# 🔐 GitHub OAuth Authentication

## Why OAuth?

**Much Better Than Manual Tokens!**

### OAuth (Recommended) ✨
- ✅ **Easy**: Just click authorize in browser
- ✅ **Secure**: No copy-pasting tokens
- ✅ **Fast**: 30 seconds setup
- ✅ **Automatic**: App handles everything
- ✅ **Rate Limit**: 5,000 requests/hour!

### Manual Tokens (Old Way) 😞
- ❌ Navigate to GitHub settings
- ❌ Create token manually
- ❌ Copy and paste
- ❌ More steps, more hassle

## Setup (30 seconds!)

1. **Run the command**
   ```bash
   ./awesome settings
   ```

2. **Choose "GitHub Authentication"**

3. **Select "OAuth (Recommended)"**

4. **Browser opens automatically**
   - You'll see a code (like: `1234-5678`)
   - Page auto-opens to github.com/login/device

5. **Enter the code and authorize**
   - Paste the code shown in terminal
   - Click "Authorize"
   - Done! 🎉

6. **Back to terminal**
   - App detects authorization
   - Token saved automatically
   - Ready to use!

## The Flow (Visual)

```
Terminal                Browser
  │                       │
  ├─ Shows code: ABCD-1234
  │                       │
  ├─ Opens browser ──────►│
  │                       │
  │                   Enter code
  │                       │
  │                   Click Authorize
  │                       │
  ◄─────── Success! ──────┤
  │                       │
  ✓ Token saved
```

## Features

### Auto Browser Opening
- App opens correct URL automatically
- Or copy-paste if you prefer

### Real-time Feedback
- Terminal shows waiting status
- Instant success message
- Progress dots while waiting

### Secure Storage
- Token stored in local SQLite
- Never transmitted except to GitHub
- Masked display in settings

### Fallback Options
- OAuth not working? Use manual token
- Manual token available as backup
- Flexible authentication

## Rate Limits Solved!

| Method | Requests/Hour | Time to Index 50 Lists |
|--------|---------------|------------------------|
| No Auth | 60 | ~50 hours |
| OAuth | 5,000 | ~30 minutes |

## Managing Authentication

### Check Status
```bash
./awesome settings
```

Shows:
- ✓ Authenticated (OAuth) or
- ✓ Authenticated (Manual) or
- ❌ Not authenticated

### Logout / Remove Token
```bash
./awesome settings
→ GitHub Auth → Logout
```

### Switch Methods
1. Logout first
2. Re-authenticate with different method

## Troubleshooting

### Browser doesn't open automatically?
- Copy the URL shown in terminal
- Paste in your browser manually
- Enter the code

### Code expired?
- Codes expire in 15 minutes
- Just run setup again
- Gets a fresh code

### OAuth not working?
- Choose "Manual Token" as fallback
- Both methods give same rate limit
- OAuth is just easier!

### Token not working?
- Check at: https://github.com/settings/applications
- Ensure "public_repo" scope enabled
- Re-authenticate if needed

## Security Notes

✅ **Token Scope**: Only `public_repo` (read-only public repos)
✅ **Local Storage**: Token never leaves your machine (except to GitHub)
✅ **Revocable**: Logout anytime from app or GitHub settings
✅ **No Write Access**: Can't modify your repos

## Comparison Chart

| Feature | OAuth | Manual Token |
|---------|-------|--------------|
| Setup Time | 30 sec | 2-3 min |
| Steps | 3 | 7 |
| Browser Opens | Auto | Manual |
| Copy-Paste | No | Yes |
| Security | Same | Same |
| Rate Limit | 5000/hr | 5000/hr |
| Ease | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## Pro Tips

💡 **Do OAuth First**: Easiest experience

💡 **Check Settings**: See auth status anytime

💡 **Index Right Away**: After auth, rate limit is ready!

💡 **Share the Love**: Tell friends OAuth is available

## Commands Reference

```bash
# Authenticate
./awesome settings → GitHub Authentication

# Check status
./awesome settings  # Shows auth status

# Logout
./awesome settings → GitHub Auth → Logout

# Start indexing (uses your auth)
./awesome index
```

---

**OAuth makes rate limits a non-issue!** 🚀

No more waiting hours - authenticate once and explore freely! ✨
