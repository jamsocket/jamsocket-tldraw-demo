"use client";

import { useSync } from "@tldraw/sync";
import { useMemo } from "react";
import {
  AssetRecordType,
  getHashForString,
  TLAssetStore,
  TLBookmarkAsset,
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

  // Create a store connected to multiplayer.
  const store = useSync({
    // We need to know the websocket's URI...
    uri: `${props.server}/connect/${props.roomId}`,
    // ...and how to handle static assets like images & videos
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

      const objectName = `${id}-${file.name}`;
      const url = `${server}/uploads/${encodeURIComponent(objectName)}`;

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
      return asset.props.src;
    },
  };
}
