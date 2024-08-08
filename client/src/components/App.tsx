"use client"

import { useSync } from '@tldraw/sync'
import { useMemo } from 'react'
import {
    AssetRecordType,
    getHashForString,
    TLAssetStore,
    TLBookmarkAsset,
    Tldraw,
    uniqueId,
} from 'tldraw'

interface AppProps {
    server: string
    roomId: string
}

function App(props: AppProps) {
    let multiplayerAssets = useMemo(() => getMultiplayerAssets(props.server), [props.server])

    // Create a store connected to multiplayer.
    const store = useSync({
        // We need to know the websocket's URI...
        uri: `${props.server}/connect/${props.roomId}`,
        // ...and how to handle static assets like images & videos
        assets: multiplayerAssets,
    })

    return (
        <div style={{ position: 'fixed', inset: 0 }}>
            <Tldraw
                // we can pass the connected store into the Tldraw component which will handle
                // loading states & enable multiplayer UX like cursors & a presence menu
                store={store}
                onMount={(editor) => {
                    // when the editor is ready, we need to register out bookmark unfurling service
                    editor.registerExternalAssetHandler('url', ({ url }: { url: string }) => unfurlBookmarkUrl({ url, server: props.server }))
                }}
            />
        </div>
    )
}

export default App

// How does our server handle assets like images and videos?
function getMultiplayerAssets(server: string): TLAssetStore {
    return {
        // to upload an asset, we prefix it with a unique id, POST it to our worker, and return the URL
        async upload(_asset, file) {
            const id = uniqueId()

            const objectName = `${id}-${file.name}`
            const url = `${server}/uploads/${encodeURIComponent(objectName)}`

            const response = await fetch(url, {
                method: 'PUT',
                body: file,
            })

            if (!response.ok) {
                throw new Error(`Failed to upload asset: ${response.statusText}`)
            }

            return url
        },
        // to retrieve an asset, we can just use the same URL. you could customize this to add extra
        // auth, or to serve optimized versions / sizes of the asset.
        resolve(asset) {
            return asset.props.src
        },

    }
}

// How does our server handle bookmark unfurling?
async function unfurlBookmarkUrl({ url, server }: { url: string, server: string }): Promise<TLBookmarkAsset> {
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
}