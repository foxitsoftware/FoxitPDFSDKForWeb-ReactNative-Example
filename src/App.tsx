import React from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';

function App(): JSX.Element {

  // const sourceUri = 'http://10.103.4.217:9999/FoxitPDFSDKForWeb/publish/8.5.2/FoxitPDFSDKForWeb_8_5_2_Full/examples/PDFViewCtrl/basic_webViewer/';
  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';

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
        />
      </View>
    </SafeAreaView>
  );
}

export default App;
