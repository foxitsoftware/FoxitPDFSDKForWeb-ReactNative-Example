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
