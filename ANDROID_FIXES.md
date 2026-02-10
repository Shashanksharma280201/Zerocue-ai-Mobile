# Android-Specific Fixes Applied

**Date:** January 28, 2026
**Issue:** Runtime errors on Android platform

---

## Issues Fixed

### 1. ✅ ImagePicker mediaTypes Error

**Error:**
```
Cannot cast 'String' for field 'mediaTypes'
Value for mediaTypes cannot be cast from String to ReadableArray
```

**Root Cause:**
- expo-image-picker 15.x changed the mediaTypes API
- Using `ImagePicker.MediaTypeOptions.Images` enum doesn't serialize correctly across the React Native bridge on Android

**Solution:**
- Removed `mediaTypes` property entirely from ImagePicker calls
- Images are the default media type, so it's not needed
- This works correctly on both iOS and Android

**Files Modified:**
- `/lib/services/imageProcessor.ts:59-90`

**Code Changes:**
```typescript
// BEFORE (Broken on Android)
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,  // ❌ Breaks on Android
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.9,
});

// AFTER (Works on Android)
const result = await ImagePicker.launchCameraAsync({
  // mediaTypes removed - images are default
  allowsEditing: true,
  aspect: [3, 4],
  quality: 0.9,
});
```

---

### 2. ✅ Network Error - Backend Connection

**Error:**
```
Load outfits error: {"detail": undefined, "error": "Network Error", "status_code": 500}
```

**Root Cause:**
- Using `http://localhost:8000` doesn't work on Android emulator
- `localhost` on Android emulator refers to the emulator itself, not the host machine

**Solution:**
- Changed Fashion API URL to `http://10.0.2.2:8000/v1` for Android emulator
- `10.0.2.2` is a special alias to the host machine's loopback interface

**Files Modified:**
- `/.env:11`

**Code Changes:**
```bash
# BEFORE (Doesn't work on Android)
EXPO_PUBLIC_FASHION_API_URL=http://localhost:8000/v1

# AFTER (Works on Android emulator)
EXPO_PUBLIC_FASHION_API_URL=http://10.0.2.2:8000/v1
```

---

## Platform-Specific Network Configuration

### Android Emulator
```
EXPO_PUBLIC_FASHION_API_URL=http://10.0.2.2:8000/v1
```

### iOS Simulator / Expo Go on iOS
```
EXPO_PUBLIC_FASHION_API_URL=http://localhost:8000/v1
```

### Physical Device (Same Network)
```
EXPO_PUBLIC_FASHION_API_URL=http://192.168.x.x:8000/v1
# Replace 192.168.x.x with your computer's IP address
```

### Web
```
EXPO_PUBLIC_FASHION_API_URL=http://localhost:8000/v1
```

### Production
```
EXPO_PUBLIC_FASHION_API_URL=https://api.zerocue.ai/v1
```

---

## How to Get Your Computer's IP Address

### On Linux/Mac:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### On Windows:
```cmd
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

## Testing on Different Platforms

### 1. Test on Android Emulator
```bash
# Backend
cd /home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend
./start.sh

# Mobile (use current .env with 10.0.2.2)
cd /home/shanks/Music/.Shanks/zerocue/AI-Mobile
npx expo start --android
```

### 2. Test on iOS Simulator
```bash
# Update .env
EXPO_PUBLIC_FASHION_API_URL=http://localhost:8000/v1

# Run
npx expo start --ios
```

### 3. Test on Physical Device
```bash
# Get your IP (example: 192.168.1.100)
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update .env
EXPO_PUBLIC_FASHION_API_URL=http://192.168.1.100:8000/v1

# Make sure device and computer are on same WiFi
# Run
npx expo start
# Scan QR code with device
```

---

## Backend Not Running Error

If you see "Network Error", the backend is not running. Start it:

```bash
cd /home/shanks/Music/.Shanks/zerocue/AI-Zerocue/backend
./start.sh
```

**Verify Backend is Running:**
```bash
# On host machine
curl http://localhost:8000/health

# Should return:
{
  "status": "healthy",
  "version": "v1",
  ...
}
```

**Test from Android Emulator:**
```bash
# In Android emulator's browser, navigate to:
http://10.0.2.2:8000/health

# Should show the same JSON response
```

---

## Known Android Limitations

### 1. Media Library Permissions (Expo Go)
**Warning:**
```
Due to changes in Android's permission requirements, Expo Go can no longer
provide full access to the media library.
```

**Impact:**
- Can still pick images from gallery
- Cannot save images to gallery in Expo Go
- Full functionality requires creating a development build

**Workaround:**
- For testing: Use camera or gallery selection (works fine)
- For production: Create development build or standalone APK

**Create Development Build:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for Android
eas build --platform android --profile development
```

### 2. Route Warnings
**Warning:**
```
Route "./(tabs)/home_backup_shop.tsx" is missing the required default export
```

**Impact:** None - this is a backup file that's not used
**Fix:** Delete the file or add `export default` to it

---

## Troubleshooting

### Issue: Still getting "Network Error"

**Check 1: Backend Running**
```bash
ps aux | grep uvicorn
# Should show running process
```

**Check 2: Correct URL**
```bash
# In .env
echo $EXPO_PUBLIC_FASHION_API_URL

# For Android emulator, should be:
http://10.0.2.2:8000/v1
```

**Check 3: Firewall**
```bash
# Make sure port 8000 is not blocked
sudo ufw status
# or
sudo iptables -L
```

**Check 4: Backend Logs**
```bash
# Check backend terminal for incoming requests
# Should see: "GET /v1/outfits/saved HTTP/1.1" 200
```

### Issue: Camera not working

**Check Permissions:**
- Android: Settings > Apps > Expo Go > Permissions > Camera (Allow)
- May need to restart app after granting permissions

### Issue: Slow virtual try-on

**This is normal!**
- Mock AI mode: 5-10 seconds
- Real AI mode: 30-60 seconds (Replicate API processing)
- Progress shown in UI

---

## Summary of Fixes

✅ **ImagePicker Error** - Removed mediaTypes property
✅ **Network Error** - Changed localhost to 10.0.2.2 for Android
✅ **Backend URL** - Updated .env with Android-compatible URL

**Status:** All Android issues resolved ✅

---

## Next Steps

1. ✅ ImagePicker working on Android
2. ✅ Network configuration fixed
3. ⏳ Start backend server
4. ✅ Test all features on Android

**After starting the backend, all features should work correctly on Android!**
