# AI-Mobile Fashion Features - Quick Start Guide

**Last Updated:** January 28, 2026
**Status:** Ready to test

## Overview

This guide will help you quickly set up and test the newly integrated fashion AI features in AI-Mobile.

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+ (for backend)
- PostgreSQL database
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

---

## Part 1: Backend Setup (5 minutes)

### Step 1: Navigate to Backend Directory

```bash
cd /home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend
```

### Step 2: Verify Environment

The backend already has:
- Virtual environment (venv) - ✅
- .env configuration - ✅
- Dependencies installed - ✅

### Step 3: Configure for Local Testing

Edit `.env` to enable mock AI mode (for testing without API costs):

```bash
# Set this to true for testing without API keys
USE_MOCK_AI=true

# Ensure local storage is enabled
USE_LOCAL_STORAGE=true

# Database (verify this matches your setup)
DATABASE_URL=postgresql://postgres:password@localhost:5432/zerocue_db
```

### Step 4: Start the Backend

```bash
./start.sh
```

Or manually:

```bash
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5: Verify Backend is Running

Open in browser:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/v1/docs

You should see:
```json
{
  "status": "healthy",
  "version": "v1",
  "environment": "development",
  "database_connected": true,
  "ai_providers": {
    "vision": "mock",
    "critique": "mock",
    "vto": "mock"
  }
}
```

---

## Part 2: Mobile App Setup (3 minutes)

### Step 1: Navigate to AI-Mobile Directory

```bash
cd /home/shanks/Music/.Shanks/zerocue/AI-Mobile
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Verify Configuration

Check that `.env` contains:

```bash
# Fashion AI API Configuration
EXPO_PUBLIC_FASHION_API_URL=http://localhost:8000/v1
```

For Android emulator, use:
```bash
EXPO_PUBLIC_FASHION_API_URL=http://10.0.2.2:8000/v1
```

For physical device on same network, use your computer's IP:
```bash
EXPO_PUBLIC_FASHION_API_URL=http://192.168.x.x:8000/v1
```

### Step 4: Start Expo Dev Server

```bash
npx expo start
```

Or for specific platforms:
```bash
npx expo start --android
npx expo start --ios
```

### Step 5: Clear Cache if Needed

If you encounter any issues:
```bash
npx expo start --clear
```

---

## Part 3: Testing the Features (10 minutes)

### Test 1: Wardrobe Tab

1. Open the app
2. Look at bottom navigation
3. Tap the "Wardrobe" tab (shirt icon)
4. Should see empty state: "No Saved Outfits"

✅ **Expected:** Empty wardrobe screen with "Analyze Your First Outfit" button

### Test 2: Upload and Analysis

1. Tap "Analyze Your First Outfit" button
2. Grant camera/gallery permissions if prompted
3. Choose "Take Photo" or "Choose from Gallery"
4. Select an outfit image (full body photo works best)
5. Optionally select an occasion (e.g., "Casual", "Work", "Party")
6. Tap "Analyze Outfit"
7. Wait for processing (5-10 seconds with mock AI)

✅ **Expected:**
- Style rating (e.g., 8.5/10)
- Detected items (color + type chips)
- Occasion suitability badges
- Style feedback with icons
- Recommendations

### Test 3: Save to Wardrobe

1. On analysis screen, tap "Save to Wardrobe"
2. See success alert: "Outfit saved to your wardrobe!"
3. Go back to Wardrobe tab
4. Should see the saved outfit in grid

✅ **Expected:** Outfit appears in wardrobe with thumbnail

### Test 4: Virtual Try-On

1. On analysis screen, tap "Try On Recommendations"
2. See list of recommendations
3. Tap "Try This On →" on any recommendation
4. Wait for processing (10-15 seconds with mock AI)
5. See before/after comparison
6. Swipe left/right to toggle between original and try-on
7. Tap "Save Try-On" to save result

✅ **Expected:**
- Swipe gesture works smoothly
- Can see confidence score
- Can save try-on result with badge

### Test 5: Delete from Wardrobe

1. Go to Wardrobe tab
2. Long press on any saved outfit
3. Confirm deletion
4. Outfit removed from grid

✅ **Expected:** Outfit deleted successfully

### Test 6: Navigation Flow

Test complete flow:
```
Home → Wardrobe → Upload → Analysis → Try-On → Wardrobe
```

✅ **Expected:** Smooth navigation with back buttons working

---

## Part 4: With Real AI (Production Mode)

### Prerequisites
- OpenAI API key (for GPT-4 Vision)
- Replicate API key (for virtual try-on)

### Step 1: Configure Backend

Edit `/home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend/.env`:

```bash
# Disable mock mode
USE_MOCK_AI=false

# Add API keys
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-4o
OPENAI_CRITIQUE_MODEL=gpt-4o

REPLICATE_API_KEY=r8_...

# Provider selection
VISION_PROVIDER=openai
CRITIQUE_PROVIDER=openai
VTO_PROVIDER=replicate_idm
```

### Step 2: Restart Backend

```bash
cd /home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend
./start.sh
```

### Step 3: Test with Real AI

Repeat all tests from Part 3. You'll now get:
- Real style analysis from GPT-4 Vision
- Actual virtual try-on generation (takes 30-60 seconds)
- More detailed and accurate feedback

### Cost Estimates
- Outfit analysis: ~$0.05 per image (GPT-4 Vision)
- Virtual try-on: ~$0.10 per generation (Replicate)
- Total per user session: ~$0.15-0.30

---

## Troubleshooting

### Backend Not Starting

**Issue:** `Database connection failed`
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or start it
sudo systemctl start postgresql
```

**Issue:** `Missing API keys`
```bash
# Use mock mode for testing
echo "USE_MOCK_AI=true" >> .env
```

### Mobile App Issues

**Issue:** "Network request failed"
```bash
# Check backend is running
curl http://localhost:8000/health

# For Android emulator, use:
EXPO_PUBLIC_FASHION_API_URL=http://10.0.2.2:8000/v1
```

**Issue:** "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start --clear
```

**Issue:** Image upload fails
```bash
# Check file size (max 10MB by default)
# Check image format (JPEG, PNG, WebP only)
# Grant camera/gallery permissions
```

### Fashion Features Not Showing

**Issue:** Wardrobe tab not visible
```bash
# Verify navigation update
grep "wardrobe" app/(tabs)/_layout.tsx

# Should see wardrobe tab definition
```

**Issue:** API calls failing
```bash
# Check .env has EXPO_PUBLIC_FASHION_API_URL
# Restart Expo dev server
npx expo start --clear
```

---

## File Structure Reference

### Backend (AI-Zerocue)
```
/home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend/
├── app/
│   ├── main.py              # FastAPI app
│   └── routers/
│       ├── outfits.py       # Analysis endpoints
│       ├── tryons.py        # Try-on endpoints
│       └── saved.py         # Wardrobe endpoints
├── ai/                      # AI provider integrations
├── db/                      # Database models
├── .env                     # Configuration
├── start.sh                 # Startup script
└── requirements.txt         # Python dependencies
```

### Mobile (AI-Mobile)
```
/home/shanks/Music/.Shanks/zerocue/AI-Mobile/
├── app/
│   ├── fashion-upload.tsx      # Upload & capture
│   ├── fashion-analysis.tsx    # Results display
│   ├── fashion-tryon.tsx       # Virtual try-on
│   └── (tabs)/
│       └── wardrobe.tsx        # Saved outfits
├── lib/
│   ├── api/fashion.ts          # API client
│   ├── stores/fashionStore.ts  # State management
│   ├── services/imageProcessor.ts  # Image handling
│   └── types/fashion.ts        # TypeScript types
├── components/ui/
│   ├── Badge.tsx
│   └── LoadingSpinner.tsx
└── .env                        # Configuration
```

---

## API Endpoints Reference

All endpoints are prefixed with `/v1`

### Outfit Analysis
- `POST /v1/outfits/analyze` - Upload and analyze outfit
- `GET /v1/outfits/analysis/:id` - Get analysis results

### Virtual Try-On
- `POST /v1/outfits/:id/try-on` - Request try-on
- `GET /v1/jobs/:id` - Get job status

### Wardrobe
- `POST /v1/outfits/save` - Save outfit
- `GET /v1/outfits/saved` - List saved outfits
- `GET /v1/outfits/saved/:id` - Get specific outfit
- `DELETE /v1/outfits/saved/:id` - Delete outfit

### Health
- `GET /health` - Health check

---

## Development Tips

### Faster Testing
1. Use `USE_MOCK_AI=true` to avoid API costs during development
2. Keep Expo dev server and backend running in separate terminals
3. Use pull-to-refresh to reload data
4. Check backend logs for debugging: `tail -f logs/app.log`

### Code Changes
When modifying fashion features:
1. Mobile changes hot-reload automatically
2. Backend changes auto-reload with `--reload` flag
3. Type changes may require restarting TypeScript server in your IDE

### Database Management
```bash
# View database tables
psql -d zerocue_db -c "\dt"

# View uploaded analyses
psql -d zerocue_db -c "SELECT * FROM outfit_analyses ORDER BY created_at DESC LIMIT 10;"

# Clear test data
psql -d zerocue_db -c "TRUNCATE TABLE outfit_analyses, saved_outfits CASCADE;"
```

---

## Next Steps

### Production Deployment

**Backend:**
1. Deploy to cloud (Railway, Render, AWS, etc.)
2. Set production environment variables
3. Configure PostgreSQL on cloud provider
4. Set up S3/R2 for image storage
5. Add Sentry for error tracking
6. Set up Redis for caching (optional)

**Mobile:**
1. Update `EXPO_PUBLIC_FASHION_API_URL` to production URL
2. Build production APK/IPA
3. Submit to app stores
4. Set up analytics (PostHog, Mixpanel, etc.)

### Feature Enhancements
- [ ] Add filters to wardrobe (by date, occasion, rating)
- [ ] Add search in wardrobe
- [ ] Add outfit collections/sets
- [ ] Add social sharing
- [ ] Add style trends and insights
- [ ] Add outfit calendar
- [ ] Add weather-based recommendations

### Performance Optimization
- [ ] Implement image lazy loading
- [ ] Add infinite scroll for wardrobe
- [ ] Cache more API responses
- [ ] Optimize image compression
- [ ] Add offline-first features

---

## Support & Documentation

- Full integration summary: `FASHION_INTEGRATION_SUMMARY.md`
- Backend docs: `/home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend/BACKEND_SETUP.md`
- API documentation: http://localhost:8000/v1/docs (when backend is running)
- Expo documentation: https://docs.expo.dev

---

## Success Checklist

- [ ] Backend starts without errors
- [ ] Health endpoint returns "healthy"
- [ ] Mobile app opens successfully
- [ ] Wardrobe tab is visible
- [ ] Can upload images (camera and gallery)
- [ ] Analysis results display correctly
- [ ] Can save outfits to wardrobe
- [ ] Virtual try-on works (mock or real)
- [ ] Swipe gesture works in try-on
- [ ] Can delete saved outfits
- [ ] Navigation flows smoothly
- [ ] No console errors in mobile app
- [ ] Backend logs show successful requests

---

**You're all set!** Start testing and enjoy your new fashion AI features.
