# FoxitPDFSDK for Web Example - React Native

These guides are divided into two parts:

- [Part 1: How to run this example](#part-1-how-to-run-this-example)
- [Part 2: How to use FoxitPDFSDK for Web in React Native](#part-2-how-to-use-foxitpdfsdk-for-web-in-react-native)

## Prerequisites

- [Android Studio](https://developer.android.com/studio) or [XCode](https://developer.apple.com/xcode/)

## System requirements

- react-native >= 0.71.7 and React Native CLI.
- react-native-webview >= 11.26.0
- @foxitsoftware/foxit-pdf-sdk-for-web-library >= 9.0.0

## Part 1: How to run this example

### 1. Setting up the development environment

Follow the React Native guide to [set up the development environment](https://reactnative.dev/docs/environment-setup).

### 2. Installation dependencies

Assume you've cloned project into the `RNWebSDKExample` directory.

#### a. Nodejs dependencies

Navigate to `RNWebSDKExample`, and execute:

```bash
npm install
```

#### b. Android dependencies

Navigate to `RNWebSDKExample/android`, and execute:

```bash
# win
gradlew build
# mac, linux
./gradlew build
```

Execute "chmod +x gradlew" if you don't have permission.

#### c. iOS dependencies

Navigate to `RNWebSDKExample/ios`, and execute:

```bash
pod install
```

### 3. Integrate Foxit PDF SDK for Web

#### 3.1. Copy the following directories to the `RNWebSDKExample/html/Web.bundle`.

- node_modules/@foxitsoftware/foxit-pdf-sdk-for-web-library/lib

#### 3.2. Update the licenseSN and licenseKey

Update the licenseSN and licenseKey values in `RNWebSDKExample/html/Web.bundle/index.html` with your own licenseSN and licenseKey that you received from sales.

### 4. Running the example

#### Android

1. Start the Metro service, navigate to `RNWebSDKExample`, and execute:
```bash
npx react-native start
```

2. Start the Android Emulator.
3. Run the app, and in the new terminal, navigate to `RNWebSDKExample` and execute:

```bash
npx react-native run-android
```

Wait for some time and your application will be automatically installed and launched in the Android emulator.

#### iOS

1. Start the Metro service, navigate to `RNWebSDKExample` and execute:

```bash
npx react-native start
```

2. Run the app, and in the new terminal, navigate to `RNWebSDKExample` and execute:

```bash
npx react-native run-ios
```

Wait for some time and your application will be automatically installed and launched in the Android emulator.

## Part 2: How to use Foxit PDF SDK for Web in React Native

### 1. Setting up the development environment

Follow the React Native guide to [set up the development environment](https://reactnative.dev/docs/environment-setup).

Assume you've created a project named `RNWebSDKExample`.

### 2. Integrate Foxit PDF SDK for Web

#### 2.1 Install dependence.
```shell
cd RNWebSDKExample
npm install @foxitsoftware/foxit-pdf-sdk-for-web-library react-native-webview react-native-fs
```

##### iOS
```shell
cd ios
pod install
```

##### Android
```shell
cd android
# win
gradlew build
# mac, linux
./gradlew build
```

#### 2.2 Create a Web resource directory

1. New an `html` directory in the `RNWebSDKExample` and new a `Web.bundle` folder inside the `html` directory.
2. Copy the following directories to the `RNWebSDKExample/html/Web.bundle`.

- node_modules/@foxitsoftware/foxit-pdf-sdk-for-web-library/lib

3. Copy the `index.html` file to the `RNWebSDKExample/html/Web.bundle` directory.

```html
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=0">
    <link rel="stylesheet" type="text/css" href="./lib/UIExtension.css">
    <style>
        html {
            overflow: hidden;
        }
        body {
            height: 100vh;
        }
        #pdf-ui {
            top: 40px;
            bottom: 0;
            position: absolute;
            width: 100vw;
        }
    </style>
</head>
<body>
<div class="fv__ui-nav">
    <div class="fv__ui-nav-logo">
        <i class="fv__icon-logo"></i>
    </div>
</div>
<div id="pdf-ui"></div>

<script src="./lib/UIExtension.full.js"></script>
<script src="./lib/preload-jr-worker.js"></script>
<script>
    const licenseSN = 'xxx';
    const licenseKey = 'xxx';
    
    const readyWorker = preloadJrWorker({
        workerPath: './lib/',
        enginePath: '../lib/jr-engine/gsdk',
        fontPath: 'http://webpdf.foxitsoftware.com/webfonts/',
        licenseSN: licenseSN,
        licenseKey: licenseKey
    });

    const PDFUI = UIExtension.PDFUI;
    const pdfui = new PDFUI({
        viewerOptions: {
            libPath: './lib',
            jr: {
                readyWorker: readyWorker
            }
        },
        renderTo: '#pdf-ui',
        appearance: UIExtension.appearances.adaptive,
        fragments: [],
        addons: './lib/uix-addons/allInOne.mobile.js'
    });
</script>
</body>
</html>
```

4. Update the licenseSN and licenseKey values in `RNWebSDKExample/html/Web.bundle/index.html` with your own licenseSN and licenseKey that you received from sales.

#### 2.3 Set up Web resource directory

##### Android

1. Open the directory `RNWebSDKExample/android` using Android Studio.
2. Update `RNWebSDKExample/android/app/build.gradle` as follows.

```diff
// ...
android {
    // ...
+    sourceSets {
+        main {
+            assets.srcDirs = ['src/main/assets', '../../html']
+        }
+    }
}
```

##### iOS

1. Open the `RNWebSDKExample/ios/RNWebSDK.xcworkspace` with XCode.
2. Expand the left directory tree `RNWebSDKExample/RNWebSDKExample`, drag and drop `RNWebSDKExample/html/Web.bundle` to the directory tree `RNWebSDKExample/RNWebSDKExample`, in the window that pops up, do not check "Copy items if needed" and click "Finish" button.

#### 2.4 Use webview to load and render the Foxit PDF SDK for Web

There are two ways to load a Web page in a webview, one is to load a URL like this:

```tsx
<WebView
    source={{uri: 'https://www.xxx.com'}}
    originWhitelist={['*']}
/>
```

The other is to load local Web resources, which we will use in the following.

1. Create a `src` directory in the `RNWebSDKExample` directory and add the `App.tsx` file to the `src`directory.

```tsx
import React, { createRef } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import RNFS from 'react-native-fs';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

function App(): JSX.Element {

  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/113.0.5672.69 Mobile/15E148 Safari/604.1';

  const webviewRef = createRef<WebView>();

  function onShouldStartLoadWithRequest(event: ShouldStartLoadRequest) {
    if (event.url.startsWith('blob:') && event.navigationType === 'click') {
      return false;
    }
    return true;
  }

  const injectedJavaScript = `
    (() => {
      const dispatchEventOri = EventTarget.prototype.dispatchEvent;
      EventTarget.prototype.dispatchEvent = function(event) {
        const download = this.getAttribute('download');
        const href = this.getAttribute('href');
        const rel = this.getAttribute('rel');
        if (download && href.startsWith('blob:') && rel === 'noopener') {
          fetch(href).then(response => response.blob()).then(blob => {
            const reader = new FileReader();
            reader.onloadend = function() {
              const data = {
                type: 'download',
                payload: {
                  fileName: download,
                  base64: reader.result,
                }
              };
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }
            reader.readAsDataURL(blob);
          });
        } else {
          dispatchEventOri.call(this, event)
        }
      }
    })();
  `;

  function onMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'download') {
      let {base64, fileName} = data.payload;
      base64 = base64.split('base64,')[1];
      const toFile = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      RNFS.writeFile(toFile, base64, 'base64');
    }
  }

  return (
    <SafeAreaView>
      <StatusBar/>
      <View style={{width: '100%', height: '100%'}}>
        <WebView
          source={{uri: sourceUri}}
          originWhitelist={['*']}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          allowFileAccess={true}
          userAgent={userAgent}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          injectedJavaScript={injectedJavaScript}
          onMessage={onMessage}
          ref={webviewRef}
        />
      </View>
    </SafeAreaView>
  );
}

export default App;
```

2. Update `RNWebSDKExample/index.js` as follows.

```diff
import {AppRegistry} from 'react-native';
- import App from './App';
+ import App from './src/App';
import {name as appName} from './app.json';
 
AppRegistry.registerComponent(appName, () => App);
```

#### 2.5 Support download feature

##### iOS

Update `RNWebSDKExample/ios/RNWebSDK/Info.plist` as follows.
```diff
<dict>
    // ...
+   <key>UIFileSharingEnabled</key>
+   <true/>
+   <key>LSSupportsOpeningDocumentsInPlace</key>
+   <true/>
+   <key>NSCameraUsageDescription</key>
+   <string>$(PRODUCT_NAME) need access to your camera.</string>
    // ...
</dict>
```

#### 2.6 Running the project

##### Android

1. Start the Metro service, navigate to `RNWebSDKExample`, and execute:

```bash
npx react-native start
```

2. Start Android Emulator.
3. Run the app, and in the new terminal, navigate to `RNWebSDKExample`and execute:

```bash
npx react-native run-android
```

Wait for some time and your application will be automatically installed and launched in the Android emulator.

##### iOS

1. Start the Metro service, navigate to `RNWebSDKExample` and execute:

```bash
npx react-native start
```

2. Run the app, and in the new terminal, navigate to `RNWebSDKExample` and execute:

```bash
npx react-native run-ios
```

Wait for some time and your application will be automatically installed and launched in the Android emulator.

