"use client";

import { useSync } from "@tldraw/sync";
import { useMemo } from "react";
import {
  TLAssetStore,
  Tldraw,
  uniqueId,
} from "tldraw";

interface AppProps {
  server: string;
  roomId: string;
}

function App(props: AppProps) {
  let multiplayerAssets = useMemo(
    () => getMultiplayerAssets(props.server),
    [props.server],
  );

  const store = useSync({
    uri: `${props.server}/connect/${props.roomId}`,
    assets: multiplayerAssets,
  });

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw
        store={store}
      />
    </div>
  );
}

export default App;

function getMultiplayerAssets(server: string): TLAssetStore {
  return {
    async upload(_asset, file) {
      const id = uniqueId();

      const extension = file.name.split(".").pop();
      const objectName = `${id}.${extension}`;
      const relativeUrl = `uploads/${objectName}`;
      const url = `${server}/${relativeUrl}`;

      const response = await fetch(url, {
        method: "PUT",
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload asset: ${response.statusText}`);
      }

      return url;
    },
    resolve(asset) {
      if (asset.props.src === null) {
        return null;
      }
      let url = asset.props.src

      let match = url.match(/\/uploads\/(.*)$/)
      if (!match) {
        return null
      }

      let id = match[1]

      url = `${server}/uploads/${id}`
      console.log('url', url)
      return url
    },
  };
}
