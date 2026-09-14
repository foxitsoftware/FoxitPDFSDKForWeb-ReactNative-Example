import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalStaticServer } from '@/hooks/use-local-static-server';
import { useTheme } from '@/hooks/use-theme';

export function LocalStaticWebView() {
  const theme = useTheme();
  const { origin, error } = useLocalStaticServer();

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small">{error}</ThemedText>
      </ThemedView>
    );
  }

  if (!origin) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.text} />
        <ThemedText type="small">正在启动本地 HTTP 服务…</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        allowFileAccess={false}
        cacheEnabled
        cacheMode="LOAD_DEFAULT"
        domStorageEnabled
        javaScriptEnabled
        limitsNavigationsToAppBoundDomains
        nestedScrollEnabled
        originWhitelist={['http://*', 'https://*']}
        source={{ uri: `${origin}/foxitwebsdk/examples/UIExtension/complete_webViewer/index.html` }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
});
