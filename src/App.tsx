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
      const message = {
        type: 'blobUrlToBase64',
        payload: event.url,
      };
      webviewRef.current?.postMessage(JSON.stringify(message));
      return false;
    }
    return true;
  }
  
  const injectedJavaScript = `
    window.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      if (data.type === 'blobUrlToBase64') {
        fetch(data.payload).then(response => response.blob()).then(blob => {
          const reader = new FileReader();
          reader.onloadend = function() {
            const data = {
              type: 'download',
              payload: reader.result,
            };
            window.ReactNativeWebView.postMessage(JSON.stringify(data)); 
          }
          reader.readAsDataURL(blob);
        });
      }
    });
  `;
  
  function onMessage(event: WebViewMessageEvent) {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'download') {
      const base64 = data.payload.split('base64,')[1];
      const toFile = `${RNFS.DocumentDirectoryPath}/download.pdf`;
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
