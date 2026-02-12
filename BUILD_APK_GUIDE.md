# ZeroCue AI-Mobile - APK Build Guide

## Prerequisites
- Node.js and npm installed
- Android SDK installed
- Java JDK 17 installed

## Commands to Build APK

### 1. Install Dependencies
```bash
npm install
```

### 2. Fix Kotlin Null-Safety Issue in expo-modules-core
```bash
# Apply the fix to expo-modules-core
sed -i 's/return requestedPermissions\.contains(permission)/return requestedPermissions?.contains(permission) ?: false/g' node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt
```

### 3. Generate Android Native Code
```bash
npx expo prebuild --clean
```

### 4. Build the APK
```bash
cd android
./gradlew assembleRelease
```

## Output Location
The generated APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## APK Details
- **Size**: ~90 MB
- **Type**: Release (unsigned)
- **Architecture**: arm64-v8a, armeabi-v7a, x86

## Important Notes

1. **Metro Config Fix**: The project includes a `metro.config.js` file that forces axios to use the browser build instead of the Node.js build. Do not remove this file.

2. **Expo SDK Version**: The project uses Expo SDK 51 with:
   - React 18.2.0
   - React Native 0.74.5

3. **Removed Packages**: The following packages were removed due to compatibility issues:
   - react-native-worklets
   - react-native-worklets-core

4. **Signing the APK**: The current APK is unsigned. To sign it for production:
   ```bash
   # Generate keystore
   keytool -genkeypair -v -storetype PKCS12 -keystore zerocue-release.keystore -alias zerocue -keyalg RSA -keysize 2048 -validity 10000

   # Sign the APK
   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore zerocue-release.keystore android/app/build/outputs/apk/release/app-release.apk zerocue

   # Zipalign
   zipalign -v 4 android/app/build/outputs/apk/release/app-release.apk zerocue-release-signed.apk
   ```

## Troubleshooting

### Issue: "requestedPermissions.contains" Kotlin error
**Solution**: Run the sed command in step 2 above

### Issue: "Unable to resolve module crypto from axios"
**Solution**: The metro.config.js file should handle this. If not, ensure it exists in the project root.

### Issue: "React Native version mismatch"
**Solution**: Run `npm install` to ensure all packages are at the correct versions

### Issue: Build fails with Gradle errors
**Solution**:
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
cd android
./gradlew assembleRelease
```

## Quick Build Script

Create a `build.sh` file with the following content:

```bash
#!/bin/bash
set -e

echo "Building ZeroCue AI-Mobile APK..."

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm install

# Step 2: Fix Kotlin null-safety issue
echo "Step 2: Fixing Kotlin null-safety issue..."
sed -i 's/return requestedPermissions\.contains(permission)/return requestedPermissions?.contains(permission) ?: false/g' node_modules/expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt

# Step 3: Generate native code
echo "Step 3: Generating Android native code..."
npx expo prebuild --clean

# Step 4: Build APK
echo "Step 4: Building APK..."
cd android
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo "📦 APK location: android/app/build/outputs/apk/release/app-release.apk"
echo "📊 APK size: $(du -h app/build/outputs/apk/release/app-release.apk | cut -f1)"
```

Make it executable:
```bash
chmod +x build.sh
```

Run it:
```bash
./build.sh
```

## Success Indicators

You'll know the build was successful when you see:
- `BUILD SUCCESSFUL` message in the terminal
- APK file exists at `android/app/build/outputs/apk/release/app-release.apk`
- File size is approximately 90 MB

## Next Steps

After building the APK:
1. Test the APK on a physical Android device or emulator
2. Sign the APK for production release
3. Optimize the APK size using ProGuard/R8 (optional)
4. Upload to Google Play Store or distribute directly
