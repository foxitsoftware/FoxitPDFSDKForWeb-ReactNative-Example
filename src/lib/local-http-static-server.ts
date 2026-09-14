import TcpSocket from 'react-native-tcp-socket';
import { File } from 'expo-file-system';

const MIME_TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  pdf: 'application/pdf',
  wasm: 'application/wasm',
};

type ClientSocket = {
  on(event: 'data', listener: (data: string | Uint8Array) => void): void;
  on(event: 'error' | 'close', listener: (...args: unknown[]) => void): void;
  write(data: string | Uint8Array): void;
  end(data?: string | Uint8Array): void;
  destroy(): void;
};

function mimeFor(path: string, requestHeaders?: Record<string, string>) {
  if (requestHeaders?.['service-worker']?.toLowerCase() === 'script') {
    return 'text/javascript; charset=utf-8';
  }
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

function normalizeRequestPath(rawPath: string) {
  const withoutQuery = rawPath.split('?')[0] ?? '/';
  let decoded = withoutQuery;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    return null;
  }

  const segments = decoded.split('/').filter((part) => part.length > 0);
  if (segments.some((part) => part === '..')) {
    return null;
  }

  if (segments.length === 0 || decoded.endsWith('/')) {
    return [...segments, 'index.html'];
  }

  return segments;
}

function resolveFile(webRootUri: string, segments: string[]) {
  const requested = new File(webRootUri, ...segments);
  if (requested.exists) {
    return requested;
  }

  const asIndex = new File(webRootUri, ...segments, 'index.html');
  if (asIndex.exists) {
    return asIndex;
  }

  return null;
}

function writeHead(socket: ClientSocket, status: number, reason: string, headers: Record<string, string>) {
  const lines = [`HTTP/1.1 ${status} ${reason}`];
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push('', '');
  socket.write(lines.join('\r\n'));
}

function staticHeaders(extra: Record<string, string> = {}) {
  return {
    'Service-Worker-Allowed': '/',
    Connection: 'close',
    ...extra,
  };
}

function isFoxitServiceWorkerChannel(requestPath: string) {
  return requestPath.includes('__foxitwebsdk-syncmsg__') || requestPath.includes('__foxitwebsdk-load-file__');
}

function headerBlockEnd(raw: string) {
  const crlf = raw.indexOf('\r\n\r\n');
  if (crlf !== -1) {
    return crlf + 4;
  }
  const lf = raw.indexOf('\n\n');
  if (lf !== -1) {
    return lf + 2;
  }
  return -1;
}

function contentLengthOf(headers: Record<string, string>) {
  const raw = headers['content-length'];
  if (!raw) {
    return 0;
  }
  const size = Number(raw);
  return Number.isFinite(size) && size > 0 ? size : 0;
}

function parseHeaders(raw: string) {
  const headerBlock = raw.split(/\r?\n\r?\n/, 1)[0] ?? raw.split(/\n\n/, 1)[0] ?? '';
  const headers: Record<string, string> = {};
  for (const line of headerBlock.split(/\r?\n/).slice(1)) {
    const separator = line.indexOf(':');
    if (separator === -1) {
      continue;
    }
    headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
  }
  return headers;
}

function parseByteRange(rangeHeader: string | undefined, size: number) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const spec = rangeHeader.slice(6).split(',')[0]?.trim();
  if (!spec) {
    return null;
  }

  const [startRaw, endRaw] = spec.split('-');
  let start = startRaw === '' ? Number.NaN : Number(startRaw);
  let end = endRaw === '' ? Number.NaN : Number(endRaw);

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else {
    if (Number.isNaN(start)) {
      return null;
    }
    if (Number.isNaN(end) || end >= size) {
      end = size - 1;
    }
  }

  if (start < 0 || start >= size || end < start) {
    return null;
  }

  return { start, end };
}

async function handleRequest(socket: ClientSocket, raw: string, webRootUri: string) {
  const [requestLine] = raw.split(/\r?\n/, 1);
  const [method, requestPath] = requestLine?.split(' ') ?? [];
  const headers = parseHeaders(raw);

  if (!method || !requestPath) {
    writeHead(socket, 400, 'Bad Request', staticHeaders({ 'Content-Length': '0' }));
    socket.end();
    return;
  }

  if (isFoxitServiceWorkerChannel(requestPath) && method !== 'GET' && method !== 'HEAD') {
    writeHead(socket, 204, 'No Content', staticHeaders({ 'Content-Length': '0' }));
    socket.end();
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    writeHead(socket, 405, 'Method Not Allowed', staticHeaders({
      Allow: 'GET, HEAD',
      'Content-Length': '0',
    }));
    socket.end();
    return;
  }

  const segments = normalizeRequestPath(requestPath);
  if (!segments) {
    writeHead(socket, 400, 'Bad Request', staticHeaders({ 'Content-Length': '0' }));
    socket.end();
    return;
  }

  const file = resolveFile(webRootUri, segments);
  if (!file) {
    const body = new TextEncoder().encode('Not Found');
    writeHead(socket, 404, 'Not Found', staticHeaders({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': String(body.byteLength),
    }));
    if (method === 'HEAD') {
      socket.end();
      return;
    }
    socket.end(body);
    return;
  }

  const body = await file.bytes();
  const range = parseByteRange(headers.range, body.byteLength);
  const payload = range ? body.subarray(range.start, range.end + 1) : body;
  writeHead(socket, range ? 206 : 200, range ? 'Partial Content' : 'OK', staticHeaders({
    'Content-Type': mimeFor(file.name, headers),
    'Content-Length': String(payload.byteLength),
    'Accept-Ranges': 'bytes',
    ...(range
      ? { 'Content-Range': `bytes ${range.start}-${range.end}/${body.byteLength}` }
      : {}),
    'Cache-Control': 'no-cache',
  }));
  if (method === 'HEAD') {
    socket.end();
    return;
  }
  socket.end(payload);
}

function attachClient(socket: ClientSocket, webRootUri: string) {
  let buffer = '';
  let handled = false;

  const onData = (data: string | Uint8Array) => {
    if (handled) {
      return;
    }
    buffer += typeof data === 'string' ? data : new TextDecoder().decode(data);
    if (buffer.length > 64 * 1024) {
      handled = true;
      writeHead(socket, 413, 'Payload Too Large', staticHeaders({ 'Content-Length': '0' }));
      socket.end();
      return;
    }

    const headerEnd = headerBlockEnd(buffer);
    if (headerEnd === -1) {
      return;
    }

    const remaining = contentLengthOf(parseHeaders(buffer)) - (buffer.length - headerEnd);
    if (remaining > 0) {
      return;
    }

    handled = true;
    void handleRequest(socket, buffer, webRootUri).catch(() => {
      writeHead(socket, 500, 'Internal Server Error', staticHeaders({ 'Content-Length': '0' }));
      socket.end();
    });
  };

  socket.on('data', onData);
  socket.on('error', () => {
    socket.destroy();
  });
}

function listen(server: ReturnType<typeof TcpSocket.createServer>, port: number) {
  return new Promise<{ address: string; port: number }>((resolve, reject) => {
    const onError = (error: unknown) => {
      reject(error instanceof Error ? error : new Error(String(error)));
    };
    server.once('error', onError);
    server.listen({ port, host: '127.0.0.1' }, () => {
      server.off('error', onError);
      const info = server.address();
      if (!info?.port) {
        reject(new Error('本地 HTTP 服务未能绑定端口'));
        return;
      }
      resolve({ address: info.address || '127.0.0.1', port: info.port });
    });
  });
}

export async function startLocalHttpStaticServer(webRootUri: string) {
  const create = () =>
    TcpSocket.createServer((socket) => {
      attachClient(socket as unknown as ClientSocket, webRootUri);
    });

  try {
    return await listen(create(), 0);
  } catch {
    return listen(create(), 18080);
  }
}
