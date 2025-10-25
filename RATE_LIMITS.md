# ⚡ GitHub Rate Limits - Solved!

## The Problem

GitHub API has strict rate limits:
- **Without token**: 60 requests/hour
- **With token**: 5000 requests/hour

When indexing awesome lists, you can easily hit the limit!

## The Solution

We've implemented a smart rate limit handler that:

### 1. **Gives You Options**
When rate limit is hit, you can choose:
- ⏰ Wait and continue (if you have time)
- ⏭️ Skip remaining and continue with what you have
- ❌ Abort the indexing

### 2. **Supports GitHub Tokens**
Add your Personal Access Token to get **83x more requests**!

#### Quick Setup (2 minutes):

1. **Generate Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name: "awesome-cli"
   - Select scope: **`public_repo`** (read-only access to public repos)
   - Click "Generate token"
   - Copy the token (looks like: `ghp_xxxxxxxxxxxx`)

2. **Add to Awesome**
   ```bash
   ./awesome settings
   # Choose: Edit settings
   # Paste your token when prompted
   ```

3. **Enjoy 5000 requests/hour!** ✨

### 3. **Better UX**
- Shows clear wait times in minutes, not seconds
- Helpful tips when rate limit is hit
- Only shows token reminder once per session
- Clean error messages

## Usage Tips

### For Quick Exploration
```bash
# Index just a sample (10 lists)
./awesome index
# Choose: "Index a random sample"
```

### For Full Indexing
```bash
# Add your token first
./awesome settings

# Then index everything
./awesome index
# Choose: "Index everything"
```

### If You Hit the Limit
When you see the rate limit message:

**Option 1: Skip and Continue** (Recommended for first run)
- You'll have partial data to explore
- Can always index more later
- No waiting!

**Option 2: Wait**
- Best if you're close to finishing
- App will wait automatically
- Can resume where it left off

**Option 3: Abort**
- Start over later with a token
- Or try a smaller sample first

## Rate Limit Math

### Without Token (60/hour)
- **1 awesome list** = ~1 request (fetch README)
- **1 repository** = ~2 requests (repo info + README)
- **Average awesome list** = ~50 repos = 100 requests
- **Result**: Can index ~0.5 lists/hour

### With Token (5000/hour)
- **Result**: Can index ~50 lists/hour (100x faster!)

## Best Practices

1. **Start Small**
   ```bash
   ./awesome index → choose "sample"
   ```

2. **Add Token Before Big Index**
   ```bash
   ./awesome settings → add token
   ./awesome index → choose "everything"
   ```

3. **Use Skip Option**
   - If rate limited, choose "Skip"
   - You'll still have data to explore!
   - Can resume indexing later

4. **Index Specific Categories**
   ```bash
   ./awesome index → choose "Select specific categories"
   # Pick just what interests you
   ```

## Pro Tips

💡 **Token is stored securely** in `~/.awesome/awesome.db` (SQLite)

💡 **Token is displayed masked** as `***xxxx` in settings

💡 **No network transmission** - token only used for GitHub API

💡 **Read-only access** - `public_repo` scope can't modify anything

💡 **Revoke anytime** at https://github.com/settings/tokens

## Summary

🎯 **Problem**: Rate limits block indexing
✅ **Solution**: Smart handler + token support
🚀 **Result**: 83x more requests, better UX!

---

**Stay awesome and never wait for rate limits again!** ✨
