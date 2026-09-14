import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const WEB_ROOT_NAME = 'www';

function getBundledWwwDirectory() {
  if (Platform.OS === 'android') {
    return new Directory('asset:///www');
  }

  return new Directory(Paths.bundle, WEB_ROOT_NAME);
}

export async function prepareStaticWebRoot(): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('本地静态站点仅支持 iOS / Android');
  }

  const webRoot = getBundledWwwDirectory();
  if (!webRoot.exists) {
    throw new Error('原生包内未找到 www 资源，请重新编译原生工程（pnpm ios / pnpm android）');
  }

  return webRoot.uri;
}
