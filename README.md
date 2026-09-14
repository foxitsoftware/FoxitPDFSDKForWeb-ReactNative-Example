# FoxitPDFSDK for Web Example - React Native

This example is based on the FoxitPDFSDK for Web example for React Native Expo framework.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) or [XCode](https://developer.apple.com/xcode/)
- @foxitsoftware/foxit-pdf-sdk-for-web-library >= 11.x
- node >= 20.x
- pnpm >= 10.x

## 1. Set up your environment

Reference the React Native Expo official documentation to configure your development environment.
- i0S：https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=simulated&mode=development-build&buildEnv=local
- Android：https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build&buildEnv=local

## 2. Installation dependencies

```bash
pnpm install
```

## 3. Copy FoxitPDFSDKForWeb library to the project

Copy the FoxitPDFSDKForWeb library to the project directory `assets/www/foxitpdfsdk/`.

## 4. Start Metro Server

```bash
pnpm start
```

## 5. Run the project

```bash
pnpm android
pnpm ios
```

Note: If occurred "The ios project is malformed, would you like to clear the project files and reinitialize them? ", please enter "y" to continue.
