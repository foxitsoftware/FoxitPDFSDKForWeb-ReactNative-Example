import { useEffect, useState } from 'react';

import { startLocalHttpStaticServer } from '@/lib/local-http-static-server';
import { prepareStaticWebRoot } from '@/lib/prepare-static-web';

type StaticServerState = {
  origin: string | null;
  error: string | null;
};

let bootPromise: Promise<string> | null = null;

function bootLocalStaticServer() {
  if (!bootPromise) {
    bootPromise = (async () => {
      const webRootUri = await prepareStaticWebRoot();
      const { port } = await startLocalHttpStaticServer(webRootUri);
      return `http://localhost:${port}`;
    })().catch((cause) => {
      bootPromise = null;
      throw cause;
    });
  }

  return bootPromise;
}

export function useLocalStaticServer(): StaticServerState {
  const [origin, setOrigin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    bootLocalStaticServer()
      .then((nextOrigin) => {
        if (!cancelled) {
          setOrigin(nextOrigin);
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { origin, error };
}
