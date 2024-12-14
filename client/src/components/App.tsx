'use client'

import { useSync } from '@tldraw/sync'
import { useMemo } from 'react'
import { TLAssetStore, Tldraw, uniqueId } from 'tldraw'

interface AppProps {
  server: string
  roomId: string
}

function App(props: AppProps) {
  let multiplayerAssets = useMemo(() => getMultiplayerAssets(props.server), [props.server])

  const store = useSync({
    uri: `${props.server}/connect/${props.roomId}`,
    assets: multiplayerAssets,
  })

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw store={store} />
    </div>
  )
}

export default App

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
