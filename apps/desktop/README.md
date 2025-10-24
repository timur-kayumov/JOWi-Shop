# JOWi Shop - Desktop POS Client

**Status:** To be implemented

## Planned Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Vite** - Build tool
- **SQLite** - Local offline database (with WAL mode)
- **@jowi/ui** - Shared component library
- **electron-builder** - Building and packaging
- **electron-updater** - Automatic updates

## Features

- Offline-first architecture
- Local database with background sync
- Barcode scanner support
- Thermal printer integration
- Fiscal device integration
- Touch-optimized interface
- Hotkey support
- **Automatic updates** - Users always have the latest version

## Auto-Update System

The desktop POS application includes an automatic update mechanism to ensure all users stay current without manual intervention.

### Implementation Plan

**Package:** `electron-updater` (part of electron-builder)

**Update Server:**
- **MVP:** GitHub Releases (automated with electron-builder publish)
- **Production:** S3 + CloudFront for faster delivery in Uzbekistan region

**Build Configuration (electron-builder):**
```json
{
  "appId": "com.jowi.shop.pos",
  "productName": "JOWi Shop POS",
  "publish": {
    "provider": "github",
    "owner": "jowi",
    "repo": "jowi-shop-desktop"
  },
  "win": {
    "target": "nsis",
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "env:WINDOWS_CERT_PASSWORD"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "differentialPackage": true
  }
}
```

**Code Signing:**
- Required for Windows to prevent security warnings
- Use EV Code Signing certificate (recommended for immediate SmartScreen trust)
- Certificate stored securely in CI/CD environment

**Update Channels:**
- `stable` - Production releases
- `beta` - Early access for testing (opt-in in settings)

### Update Flow

1. **Check for Updates:**
   - On app startup
   - Every 4-6 hours in background
   - Manual check via Help → Check for Updates

2. **Download Update:**
   - Downloads in background without interrupting work
   - Shows progress notification (optional, can be hidden)
   - Delta updates minimize download size

3. **Notify User:**
   - Toast notification: "Обновление готово к установке" (Update ready to install)
   - "Установить обновление" (Install update) button
   - "Напомнить позже" (Remind later) option

4. **Install Update:**
   - Saves current POS state
   - Closes active shift warning if shift is open
   - Runs NSIS installer
   - Restarts application automatically
   - Validates database schema compatibility

5. **Post-Update:**
   - Shows release notes (optional)
   - Validates all hardware connections (printer, scanner, fiscal device)
   - Resumes sync with server

### Implementation Example

```typescript
// main/auto-updater.ts
import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';

export function initAutoUpdater(mainWindow: BrowserWindow) {
  // Configure
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  // Check for updates on startup
  app.whenReady().then(() => {
    autoUpdater.checkForUpdates();
  });

  // Check every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 6 * 60 * 60 * 1000);

  // Events
  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    console.error('Update error:', error);
    mainWindow.webContents.send('update-error', error);
  });
}

// Trigger update installation (called from renderer)
export function installUpdate() {
  autoUpdater.quitAndInstall(false, true);
}
```

### UI Components

**Update Notification Toast:**
```tsx
// renderer/components/UpdateNotification.tsx
export function UpdateNotification({ version, releaseNotes }) {
  return (
    <Toast>
      <ToastTitle>Обновление готово</ToastTitle>
      <ToastDescription>
        Версия {version} загружена и готова к установке
      </ToastDescription>
      <ToastAction onClick={handleInstall}>
        Установить обновление
      </ToastAction>
      <ToastAction onClick={handleDismiss} variant="ghost">
        Напомнить позже
      </ToastAction>
    </Toast>
  );
}
```

**Manual Update Check (Settings):**
```tsx
// renderer/pages/Settings.tsx
<Button onClick={checkForUpdates}>
  Проверить обновления
</Button>
```

### Error Handling

- **Download fails:** Retry with exponential backoff (max 3 attempts)
- **Installation fails:** Rollback to previous version automatically
- **Incompatible database schema:** Show migration required message
- **Network offline:** Silent failure, retry when online

### Logging & Monitoring

All update events logged to:
- Local audit log (SQLite)
- Server analytics (update success/failure rates)
- Error tracking service (Sentry)

### Security

- All updates verified with SHA-512 checksums
- Only signed packages accepted
- HTTPS-only communication
- Certificate pinning for update server

### Testing

- Test updates on staging environment first
- Beta channel for early adopters
- Rollback procedure tested regularly
- Monitor update success rates

## Development

This app will be implemented in a future iteration. The core backend and web admin are being developed first.

### Future Build Commands

```bash
# Development
pnpm dev

# Build for testing
pnpm build

# Package for distribution
pnpm package

# Build and publish to GitHub Releases
pnpm publish
```
