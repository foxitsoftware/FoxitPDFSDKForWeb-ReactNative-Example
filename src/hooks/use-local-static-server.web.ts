export function useLocalStaticServer() {
  return {
    origin: null,
    error: '本地静态服务仅支持 iOS / Android 开发构建',
  };
}
