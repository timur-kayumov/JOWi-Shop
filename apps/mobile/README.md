# JOWi Shop Mobile POS

Flutter-based Point of Sale application for Android tablets.

## Overview

This is the mobile POS (Point of Sale) application for JOWi Shop, built with Flutter for Android tablets running Android 11+ (API 30). The app is designed to work offline-first with local Isar database and sync data with the backend when online.

## Target Devices

- **Platform:** Android 11 (API 30) or higher
- **Screen Size:** 10"+ tablets (optimized for landscape mode)
- **Recommended:** Samsung Tab A8, Lenovo Tab M10, or similar
- **Minimum RAM:** 4GB
- **Storage:** 32GB minimum

## Prerequisites

Before you begin, ensure you have the following installed:

- **Flutter SDK** 3.16 or higher
- **Dart** 3.0 or higher
- **Android Studio** with Android SDK (API 30+)
- **Java Development Kit (JDK)** 17 or higher
- **Git** for version control

## Project Setup

Since the Flutter project hasn't been created yet, follow these steps to initialize it:

### 1. Create Flutter Project

```bash
# Navigate to the apps directory
cd apps

# Create Flutter project with custom organization
flutter create --org com.jowi.shop --project-name jowi_pos --platforms android mobile

# This will create the mobile directory with Flutter structure
```

### 2. Update pubspec.yaml

After creating the project, replace the `pubspec.yaml` content with the dependencies listed below.

### 3. Install Dependencies

```bash
cd mobile
flutter pub get
```

## Recommended Dependencies

Add these to `pubspec.yaml`:

```yaml
name: jowi_pos
description: JOWi Shop Mobile POS Application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # Local Database
  isar: ^3.1.0
  isar_flutter_libs: ^3.1.0
  path_provider: ^2.1.1

  # HTTP & API
  dio: ^5.4.0
  retrofit: ^4.0.0
  pretty_dio_logger: ^1.3.1

  # Background Tasks
  workmanager: ^0.5.1

  # JSON Serialization
  json_annotation: ^4.8.1
  freezed_annotation: ^2.4.1

  # Routing
  go_router: ^13.0.0

  # UI
  gap: ^3.0.1

  # Forms
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0

  # i18n
  easy_localization: ^3.0.3
  intl: ^0.18.1

  # Barcode Scanner
  mobile_scanner: ^3.5.0

  # Thermal Printer
  esc_pos_printer: ^4.1.0
  esc_pos_bluetooth: ^0.4.1
  esc_pos_utils: ^1.1.0

  # Phone Input
  intl_phone_field: ^3.2.0

  # Utils
  equatable: ^2.0.5
  logger: ^2.0.2+1
  connectivity_plus: ^5.0.0

  # Permissions
  permission_handler: ^11.1.0

  # Device Info
  device_info_plus: ^9.1.1
  package_info_plus: ^5.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter

  # Build Runner
  build_runner: ^2.4.7

  # Code Generation
  retrofit_generator: ^7.0.8
  json_serializable: ^6.7.1
  riverpod_generator: ^2.3.9
  freezed: ^2.4.6
  isar_generator: ^3.1.0

  # Linting
  flutter_lints: ^3.0.1

flutter:
  uses-material-design: true

  # Add assets
  assets:
    - assets/translations/
    - assets/images/

  # Fonts
  fonts:
    - family: Roboto
      fonts:
        - asset: fonts/Roboto-Regular.ttf
        - asset: fonts/Roboto-Medium.ttf
          weight: 500
        - asset: fonts/Roboto-Bold.ttf
          weight: 700
```

## Project Structure

```
mobile/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── app.dart                  # MaterialApp setup
│   ├── core/
│   │   ├── api/                  # HTTP client & endpoints
│   │   ├── database/             # Isar database setup
│   │   ├── models/               # Data models
│   │   ├── router/               # Navigation routes
│   │   ├── services/             # Business logic services
│   │   └── utils/                # Utilities & constants
│   ├── features/
│   │   ├── auth/                 # Authentication feature
│   │   ├── pos/                  # POS screens
│   │   ├── products/             # Product management
│   │   ├── inventory/            # Inventory operations
│   │   ├── customers/            # Customer management
│   │   ├── reports/              # Reports & analytics
│   │   └── settings/             # App settings
│   ├── shared/
│   │   ├── themes/               # Material 3 themes
│   │   └── widgets/              # Reusable widgets
│   └── l10n/                     # Translations (RU/UZ)
├── android/                      # Android-specific code
├── test/                         # Unit & widget tests
├── integration_test/             # Integration tests
└── pubspec.yaml                  # Dependencies
```

## Development Commands

```bash
# Get dependencies
flutter pub get

# Run app on connected device/emulator
flutter run

# Run app in release mode
flutter run --release

# Build APK (debug)
flutter build apk --debug

# Build APK (release)
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release

# Run tests
flutter test

# Analyze code
flutter analyze

# Format code
flutter format lib/

# Generate code (for freezed, riverpod_generator, etc.)
flutter pub run build_runner build --delete-conflicting-outputs

# Watch for changes and regenerate code
flutter pub run build_runner watch --delete-conflicting-outputs
```

## Android Configuration

### Minimum Requirements

Edit `android/app/build.gradle`:

```gradle
android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.jowi.shop.pos"
        minSdkVersion 30  // Android 11
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Required Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Network -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Bluetooth -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

    <!-- Camera (for barcode scanning) -->
    <uses-permission android:name="android.permission.CAMERA" />

    <!-- USB -->
    <uses-permission android:name="android.permission.USB_PERMISSION" />

    <!-- Storage -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <!-- Background work -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application ...>
        <!-- Your app configuration -->
    </application>
</manifest>
```

## Hardware Integration

### Thermal Printers

- **Bluetooth:** Use `esc_pos_bluetooth` package
- **Network:** Use `esc_pos_printer` package
- **USB:** Use platform channels or `usb_serial`

### Barcode Scanners

- **USB OTG:** Works natively as keyboard input
- **Camera:** Use `mobile_scanner` package

### Fiscal Devices

- **Option A:** REST API to fiscal-gateway service (recommended for MVP)
- **Option B:** Platform Channels with native Android SDK

## Deployment

### Debug APK

```bash
flutter build apk --debug
```

APK location: `build/app/outputs/flutter-apk/app-debug.apk`

### Release APK

```bash
flutter build apk --release
```

APK location: `build/app/outputs/flutter-apk/app-release.apk`

### App Bundle (Play Store)

```bash
flutter build appbundle --release
```

Bundle location: `build/app/outputs/bundle/release/app-release.aab`

### Code Signing

Create `android/key.properties`:

```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=jowi-pos
storeFile=<path-to-your-keystore>
```

Update `android/app/build.gradle` to reference keystore.

## Testing

### Unit Tests

```bash
flutter test
```

### Widget Tests

```bash
flutter test test/widget/
```

### Integration Tests

```bash
flutter drive --driver=test_driver/integration_test.dart --target=integration_test/app_test.dart
```

## Performance Optimization

For large product catalogs (50k-200k items):

- Use Isar database (10x faster than sqflite)
- Implement lazy loading with pagination
- Use virtualization for long lists
- Debounce search input (300ms)
- Index frequently queried fields
- Cache popular products in memory

## Troubleshooting

### Common Issues

**Issue:** `Gradle build failed`
- Ensure Android SDK is installed (API 30+)
- Run `flutter doctor` to check for issues
- Clean build: `flutter clean && flutter pub get`

**Issue:** `Cannot find symbol: BuildConfig`
- Sync Gradle files in Android Studio
- Invalidate caches and restart

**Issue:** `App crashes on startup`
- Check AndroidManifest.xml permissions
- Verify minimum SDK version (30)
- Check Logcat for error messages

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [Material Design 3](https://m3.material.io/)
- [Isar Database](https://isar.dev/)
- [Riverpod State Management](https://riverpod.dev/)

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact the development team.
