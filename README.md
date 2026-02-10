# ScanPay Mobile - Self-Checkout Shopping App

A barcode-first self-checkout mobile application built with React Native and Expo. Scan products, self-checkout with UPI, and show QR receipt at exit.

## Features

- 📱 Phone OTP Authentication
- 🏬 Store Discovery & Selection
- 🔍 Barcode Scanning with Camera
- 🛒 Shopping Cart Management
- 💳 UPI Payment Integration (Ready for Razorpay)
- 📄 QR Receipt Generation & Display
- 📦 Order History
- 👤 User Profile Management
- ⚡ Offline-Ready (Coming Soon)
- 🎨 Beautiful UI/UX optimized for iOS & Android

## Tech Stack

- **Framework:** Expo SDK 54+ with React Native
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL + Auth)
- **Camera:** Expo Camera + Barcode Scanner
- **Styling:** React Native StyleSheet
- **Storage:** Expo Secure Store

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Supabase account (free tier works)

## Quick Start

### 1. Clone and Install

```bash
cd scanpay-mobile
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_API_BASE_URL=http://your-zentropos-url.com
```

Get these from your Supabase project:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy URL and anon/public key

### 3. Start Development Server

```bash
npm start
```

This will:
- Start Expo dev server
- Show QR code in terminal
- Open dev tools in browser

### 4. Run on Your Phone

**Using Expo Go (Easiest):**

1. Install Expo Go on your phone
2. Scan QR code from terminal with:
   - **iOS:** Camera app
   - **Android:** Expo Go app
3. App will load on your phone!

**Alternative Commands:**

```bash
npm run android  # Run on Android emulator
npm run ios      # Run on iOS simulator (Mac only)
```

## Project Structure

```
scanpay-mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   │   ├── welcome.tsx    # Welcome/onboarding
│   │   ├── phone.tsx      # Phone input
│   │   └── otp.tsx        # OTP verification
│   ├── (tabs)/            # Main app tabs
│   │   ├── _layout.tsx    # Tab navigator
│   │   ├── home.tsx       # Home & product discovery
│   │   ├── cart.tsx       # Shopping cart
│   │   ├── orders.tsx     # Order history
│   │   └── profile.tsx    # User profile
│   ├── scan.tsx           # Barcode scanner
│   ├── checkout.tsx       # Checkout flow
│   ├── receipt/[id].tsx   # QR receipt display
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable components
│   └── ui/               # UI primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── ProductCard.tsx
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase client
│   ├── types.ts          # TypeScript types
│   └── stores/           # Zustand stores
│       ├── authStore.ts  # Auth state
│       └── cartStore.ts  # Cart state
├── constants/            # Design tokens
│   └── Colors.ts         # Colors & theme
└── assets/               # Images & fonts
```

## Key Features Explained

### 1. Authentication Flow

```
Welcome Screen → Phone Input → OTP Verification → Home
```

- Uses Supabase Auth
- Secure OTP via SMS (configure Twilio in Supabase)
- Session stored in Expo Secure Store

### 2. Shopping Flow

```
Home → Scan/Search Product → Add to Cart → Checkout → Payment → Receipt
```

### 3. Barcode Scanning

- Camera permission requested on first use
- Supports EAN-13, UPC-A, Code128, QR codes
- Haptic feedback on scan
- Manual product search fallback

### 4. Cart Management

- Add/remove/update quantities
- Real-time price calculation
- Tax computation
- Persistent across app restarts

### 5. QR Receipt

- Generated after successful payment
- JWT-signed token for security
- Scannable by staff at verification station
- Share via WhatsApp/SMS

## Testing on Expo Go

### What Works:
✅ All UI/UX
✅ Navigation
✅ State management
✅ Supabase API calls
✅ Camera barcode scanning
✅ QR code generation/display

### Limitations:
- Some native features require development build
- Push notifications need custom build
- Payment SDK might need custom build (use web fallback)

## Building for Production

### Create Development Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile development

# Build for iOS
eas build --platform ios --profile development
```

### Create Production Build

```bash
# Android APK/AAB
eas build --platform android --profile production

# iOS IPA
eas build --platform ios --profile production
```

### Submit to Stores

```bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
```

## Connecting to Backend

This app connects to the **zentro-pos** backend. Ensure:

1. Backend is running and accessible
2. Supabase RLS policies allow mobile clients
3. CORS is configured for your domain
4. API endpoints match those in web app

## Performance Optimization

### Bundle Size Tips:
- Using Hermes engine (enabled by default)
- Tree-shaking unused code
- Lazy loading heavy components
- Optimized images with caching

### Current Bundle Size:
- Android: ~15-20 MB (minified)
- iOS: ~18-25 MB (minified)

## Troubleshooting

### "Unable to resolve module"
```bash
npm install
rm -rf node_modules/.cache
npm start -- --clear
```

### Camera not working
- Check permissions in Settings
- Reload app
- Ensure running on real device (not simulator for camera)

### Supabase errors
- Check `.env` file exists
- Verify API keys are correct
- Test connection in Supabase dashboard

### QR Code not scanning
- Ensure good lighting
- Hold steady for 1-2 seconds
- Try manual entry option

## Development Tips

### Hot Reload
Press `r` in terminal to reload app

### Debug Menu
Shake device or press:
- **iOS:** Cmd+D in simulator
- **Android:** Cmd+M in emulator

### Viewing Logs
```bash
npm start
# Then press 'j' to open debugger
```

## Customization

### Change Theme Colors
Edit `constants/Colors.ts`:
```typescript
export const Colors = {
  primary: '#3B82F6',  // Change to your brand color
  // ...
};
```

### Add New Screens
1. Create file in `app/` directory
2. File name becomes route (e.g., `app/settings.tsx` → `/settings`)
3. Use `router.push()` to navigate

### Modify Cart Logic
Edit `lib/stores/cartStore.ts` for:
- Custom pricing logic
- Discount calculations
- Promo codes

## API Documentation

### Supabase Tables Used

- **users** - User profiles
- **stores** - Store locations
- **products** - Product catalog
- **store_inventory** - Stock per store
- **carts** - Orders/transactions
- **cart_items** - Line items
- **payments** - Payment records
- **receipts** - QR codes

### Required RLS Policies

Ensure these policies exist in Supabase:
```sql
-- Users can view products
CREATE POLICY "Allow product read" ON products FOR SELECT USING (true);

-- Users can create/view their own carts
CREATE POLICY "Users manage own carts" ON carts FOR ALL USING (auth.uid() = user_id);

-- More policies in zentro-pos/supabase/schema.sql
```

## Upcoming Features

- [ ] Offline mode with SQLite sync
- [ ] Push notifications for order updates
- [ ] Wishlist/favorites
- [ ] Product reviews & ratings
- [ ] Store maps & navigation
- [ ] Payment history export
- [ ] Dark mode
- [ ] Multi-language support (Hindi + English)

## Support

### Issues?
- Check logs in Expo Go
- Enable debug mode
- Check Supabase logs
- Test API endpoints in Postman

### Need Help?
- Expo Docs: https://docs.expo.dev
- Supabase Docs: https://supabase.com/docs
- React Native Docs: https://reactnative.dev

## License

MIT

## Related Projects

- **zentro-pos** - Backend POS system (Next.js)
- **scanpay-web** - Admin web dashboard

---

Built with ❤️ using Expo & React Native

**Version:** 1.0.0
**Min OS:** iOS 13+, Android 6.0+
**Last Updated:** 2025-01-02
