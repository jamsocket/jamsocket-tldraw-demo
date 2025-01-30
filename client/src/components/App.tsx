'use client'

import { useSync } from '@tldraw/sync'
import { useMemo, useEffect, useState } from 'react'
import { SessionBackend, ConnectResponse } from '@jamsocket/client'
import {
  AssetRecordType,
  Editor,
  getHashForString,
  TLAssetStore,
  TLBookmarkAsset,
  Tldraw,
  uniqueId,
} from 'tldraw'

interface AppProps {
  roomId: string
}

export default function App(props: AppProps) {
  const [connectResponse, setConnectResponse] = useState<ConnectResponse | null>(null)

  useEffect(() => {
    let sessionBackend: SessionBackend | null = null
    let canceled = false
    ;(async () => {
      while (!canceled) {
        const result = await fetch('/api/connect', {
          method: 'POST',
          body: JSON.stringify({ docId: props.roomId }),
        })
        const data = await result.json()
        setConnectResponse(data)
        sessionBackend = new SessionBackend(data)
        await sessionBackend.onTerminatedPromise
        sessionBackend.destroy()
      }
    })()
    return () => {
      canceled = true
      if (sessionBackend) {
        sessionBackend.destroy()
      }
    }
  }, [props.roomId])

  if (!connectResponse) {
    return <div>Loading...</div>
  }

  const serverUrl = connectResponse.url.replace(/\/$/, '')
  return <TldrawApp server={serverUrl} roomId={props.roomId} />
}

function TldrawApp(props: { server: string; roomId: string }) {
  let multiplayerAssets = useMemo(() => getMultiplayerAssets(props.server), [props.server])

  const store = useSync({
    uri: `${props.server}/connect/${props.roomId}`,
    assets: multiplayerAssets,
  })

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        store={store}
        onMount={(editor) => {
          registerExternalAssetHandler(editor, props.server)
        }}
      />
    </div>
  )
}

function registerExternalAssetHandler(editor: Editor, server: string) {
  editor.registerExternalAssetHandler('url', async ({ url }) => {
    const asset: TLBookmarkAsset = {
      id: AssetRecordType.createId(getHashForString(url)),
      typeName: 'asset',
      type: 'bookmark',
      meta: {},
      props: {
        src: url,
        description: '',
        image: '',
        favicon: '',
        title: '',
      },
    }

    try {
      const response = await fetch(`${server}/unfurl?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      asset.props.description = data?.description ?? ''
      asset.props.image = data?.image ?? ''
      asset.props.favicon = data?.favicon ?? ''
      asset.props.title = data?.title ?? ''
    } catch (e) {
      console.error(e)
    }

    return asset
  })
}

function getMultiplayerAssets(server: string): TLAssetStore {
  return {
    async upload(_asset, file) {
      const id = uniqueId()

      const extension = file.name.split('.').pop()
      const objectName = `${id}.${extension}`
      const url = `${server}/uploads/${objectName}`

      const response = await fetch(url, {
        method: 'PUT',
        body: file,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload asset: ${response.statusText}`)
      }

      return 'asset:' + objectName
    },
    resolve(asset) {
      let src = asset.props.src

      if (!src) {
        return null
      }

      if (src.startsWith('asset:')) {
        let objectId = src.split('asset:')[1]
        return `${server}/uploads/${objectId}`
      }

      return null
    },
  }
}
