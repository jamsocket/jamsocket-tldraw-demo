import { Readable } from 'stream'
import { LRUCache } from 'lru-cache'
import { readFromS3, writeToS3 } from './persist'

const SIZE_LIMIT_BYTES = 500 * 1024 * 1024 // 500MB

async function readStream(stream: Readable) {
	const chunks: Buffer[] = []
	for await (const chunk of stream) {
		chunks.push(Buffer.from(chunk))
	}

	return new Uint8Array(Buffer.concat(chunks))
}

type Asset = {
	data: Uint8Array
}

const CACHE = new LRUCache<string, Asset>({
	maxSize: SIZE_LIMIT_BYTES,
	sizeCalculation: (asset) => asset.data.length,
	updateAgeOnGet: true,
})

export async function storeAsset(id: string, stream: Readable) {
	try {
		const data = await readStream(stream)
		CACHE.set(id, { data })

		writeToS3(`assets/${id}`, data)
	} catch (error) {
		console.error(error)
		throw error
	}
}

export async function loadAsset(id: string): Promise<Uint8Array | null> {
	let asset = null
	asset = CACHE.get(id)
	
	if (asset) {
		return asset.data
	}

	asset = await readFromS3(`assets/${id}`)

	if (asset) {
		CACHE.set(id, { data: asset })
		return asset.data
	}

	return null
}
