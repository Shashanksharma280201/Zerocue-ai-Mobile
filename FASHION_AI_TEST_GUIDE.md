# Fashion AI End-to-End Testing Guide

## Overview
This guide will walk you through testing the complete Fashion AI flow using **mock data mode**. No backend is required - all features work with realistic mock data.

## Mock Mode Configuration
✅ **Already enabled** - Mock mode is active by default in `lib/api/fashion.ts`

Look for console logs with 🎭 emoji to confirm mock mode is working.

## Prerequisites
1. Expo dev server running: `npx expo start`
2. Mobile device or emulator connected
3. User authenticated (select a store first)

---

## Test Flow #1: Complete Fashion Analysis Journey

### Step 1: Navigate to Wardrobe Tab
- Tap the **Wardrobe** tab icon (👕 shirt icon) in the bottom navigation
- You should see an empty state with "Analyze First Outfit" button

### Step 2: Upload an Outfit Photo
From the wardrobe screen:
1. Tap the **"+"** button in the header, OR
2. Tap **"Analyze First Outfit"** button

You'll be taken to the Fashion Upload screen where you can:
- **Take Photo** - Opens camera
- **Choose from Gallery** - Opens photo picker

**Expected behavior:**
- Upload screen shows occasion selector (Casual, Work, Formal, Party, Date, Workout)
- Selected image preview appears
- "Analyze Outfit" button becomes active

### Step 3: Analyze Outfit
1. Select an occasion (e.g., "Casual")
2. Tap **"Analyze Outfit"**

**Expected behavior:**
- Loading spinner appears with message "Analyzing your style..."
- Takes ~2 seconds (simulated API delay)
- Console shows: `🎭 Fashion AI: Using mock data mode`
- Navigates to Analysis screen

### Step 4: Review Analysis Results
The analysis screen displays:

**Style Rating:**
- Rating: 8.5/10
- Assessment: "Great casual look! The outfit shows good color coordination..."

**Detected Items:**
- White T-Shirt (95% confidence)
- Blue Jeans (92% confidence)
- Black Sneakers (88% confidence)

**Occasion Suitability:**
- Casual: 95%
- Work: 65%
- Party: 45%

**Style Feedback:**
- ✅ Fit: "The fit looks comfortable and flattering"
- ✅ Color: "Neutral tones work well together"
- 💡 Accessories: "Consider adding a watch or bracelet..."

**Recommendations (3 items):**
1. **Jacket** - "Add a denim jacket for layering"
2. **Accessories** - "Silver watch or leather bracelet"
3. **Shoes** - "Try white sneakers for a cleaner look"

**Product Catalog Integration:**
- Each recommendation may show "Available in Store" badge
- If matching products exist in catalog, displays:
  - Product name
  - Price (₹)
  - "Shop Now" button

**Test catalog integration:**
- Tap "Shop Now" → navigates to product detail page
- Can add to cart directly from there

### Step 5: Save to Wardrobe
1. Scroll down on analysis screen
2. Tap **"Save to Wardrobe"** button

**Expected behavior:**
- Alert: "Success - Outfit saved to your wardrobe!"
- Console shows: `🎭 Fashion AI: Mock save outfit`
- Outfit is now in wardrobe cache

### Step 6: Virtual Try-On (Optional)
1. On analysis screen, tap **"Try On Recommendations"**
2. Select one of the 3 recommendations
3. Tap **"Try This On"**

**Expected behavior:**
- Processing message appears
- Console shows: `🎭 Fashion AI: Mock virtual try-on requested`
- After ~3 seconds, shows before/after comparison
- Swipe left/right to compare original vs try-on result
- Confidence score displayed (87%)

**Try-On Controls:**
- Swipe gesture toggles between before/after
- "Save This Look" - saves try-on to wardrobe
- "Try Another" - returns to recommendation selection

### Step 7: View Wardrobe
1. Navigate back to **Wardrobe** tab
2. Your saved outfit(s) now appear in grid

**Wardrobe Features:**
- 2-column grid layout
- Shows outfit image
- Style rating badge (8.5/10)
- Try-on badge if applicable (📸)
- Tags display

**Test deletion:**
- Long press on any outfit card
- Alert: "Delete this outfit?"
- Confirm to remove

---

## Test Flow #2: Quick Analysis from Product Page

### Option A: Analyze Product Styling
1. Go to **Home** tab
2. Tap any product
3. Tap the **camera/upload icon** in product detail
4. Takes you to fashion upload with product pre-loaded
5. Follow steps 3-7 above

---

## Test Scenarios

### Scenario 1: Multiple Outfits
- Analyze 3-5 different outfits
- Each gets unique analysis_id
- All appear in wardrobe
- Test scrolling performance in grid

### Scenario 2: Try-On Multiple Recommendations
- Complete analysis
- Try on all 3 recommendations
- Compare confidence scores
- Save best looking try-on

### Scenario 3: Shopping Integration
- Complete analysis
- Find "Available in Store" products
- Tap "Shop Now"
- Add to cart
- Proceed to checkout

### Scenario 4: Empty States
1. Fresh install → Empty wardrobe
2. No saved outfits → Shows helpful CTA
3. No recommendations → Analysis still saves

### Scenario 5: Pull to Refresh
- Pull down on analysis screen → reloads data
- Pull down on wardrobe → refreshes saved outfits

---

## Mock Data Details

### Mock Analysis Includes:
- **Style Rating**: 8.5/10
- **Detected Items**: 3 items (T-Shirt, Jeans, Sneakers)
- **Occasions**: 3 suitability scores
- **Feedback**: 3 items (2 positive, 1 suggestion)
- **Recommendations**: 3 items with product images

### Mock Try-On:
- Result image: Denim jacket mockup
- Confidence: 87%
- Processing time: ~3 seconds

### Product Matching Algorithm:
Automatically matches recommendations with catalog:
- Jacket → searches for "jacket" in product names
- Accessories → searches for "watch", "bracelet"
- Shoes → searches for "shoes", "sneakers"

---

## Console Logs to Expect

```
🎭 Fashion AI: Using mock data mode
🎭 Fashion AI: Mock virtual try-on requested
🎭 Fashion AI: Mock virtual try-on status check
🎭 Fashion AI: Mock save outfit
🎭 Fashion AI: Mock get saved outfits
🎭 Fashion AI: Mock delete saved outfit
```

---

## Known Limitations (Mock Mode)

1. **Same mock analysis for all uploads**
   - All photos get same rating/feedback
   - Image URL uses uploaded photo

2. **Same try-on result**
   - Always shows denim jacket mockup
   - Confidence always 87%

3. **No persistence across app restarts**
   - Wardrobe data in cache only
   - Clears on app restart

4. **Product matching is basic**
   - Simple keyword matching
   - May not find all relevant products

---

## Switching to Real Backend

To test with actual AI backend:

1. **Start Backend** (from AI-Zerocue repository)
```bash
cd /path/to/AI-Zerocue/backend
uvicorn main:app --reload --port 8000
```

2. **Update Mock Mode**
```typescript
// lib/api/fashion.ts
const USE_MOCK_DATA = false; // Disable mock mode
```

3. **Restart Expo**
```bash
npx expo start --clear
```

---

## Troubleshooting

### Image Upload Issues
- **iOS**: Check photo library permissions
- **Android**: Check storage permissions
- Try both camera and gallery

### Navigation Issues
- Clear navigation stack: Kill and restart app
- Check tab bar appears at bottom

### Cache Issues
- Clear AsyncStorage: Settings → Developer Menu → Clear AsyncStorage
- Or uninstall/reinstall app

### No Products Showing
- Ensure Supabase has products in catalog
- Check product categories match recommendations

---

## Success Criteria

✅ Upload and analyze outfit
✅ See realistic analysis results
✅ View recommendations with styling advice
✅ See "Available in Store" products
✅ Navigate to product pages
✅ Complete virtual try-on
✅ Save to wardrobe
✅ View wardrobe grid
✅ Delete outfits
✅ Pull to refresh works

---

## Performance Benchmarks

- **Upload → Analysis**: ~2 seconds
- **Virtual Try-On**: ~3 seconds
- **Save to Wardrobe**: Instant
- **Wardrobe Load**: <500ms
- **Product Matching**: Instant (local)

---

## Next Steps

After successful mock testing:
1. Deploy real Fashion AI backend
2. Configure .env with production API URL
3. Test with actual AI analysis
4. Fine-tune product matching algorithm
5. Add more recommendation categories

---

## Support

For issues or questions:
- Check console logs (look for 🎭 emoji)
- Verify mock mode is enabled
- Check AsyncStorage for cached data
- Enable React DevTools for debugging
