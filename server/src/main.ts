import cors from '@fastify/cors'
import websocketPlugin from '@fastify/websocket'
import fastify from 'fastify'
// import { loadAsset, storeAsset } from './assets'
// import { unfurl } from './unfurl'
import { getRoomState } from './rooms'

const PORT = parseInt(process.env.PORT || '8080')
export const ROOM_ID = process.env.SESSION_BACKEND_KEY || 'default'

async function main() {
	const roomState = await getRoomState()
	const app = fastify()
	app.register(websocketPlugin)
	app.register(cors, { origin: '*' })

	app.register(async (app) => {
		app.get('/connect/:roomId', { websocket: true }, async (socket, req) => {
			const roomId = (req.params as any).roomId as string
			if (roomId !== ROOM_ID) {
				socket.send(JSON.stringify({
					type: 'error',
					message: `Wrong session backend for given room ID. Expected ${ROOM_ID}; got ${roomId}.`
				}))
				socket.close()
				return
			}

			const sessionId = (req.query as any)?.['sessionId'] as string
			roomState.room.handleSocketConnect({ sessionId, socket })
		})

		// app.addContentTypeParser('*', (_, __, done) => done(null))
		// app.put('/uploads/:id', {}, async (req, res) => {
		// 	const id = (req.params as any).id as string
		// 	await storeAsset(id, req.raw)
		// 	res.send({ ok: true })
		// })
		// app.get('/uploads/:id', async (req, res) => {
		// 	const id = (req.params as any).id as string
		// 	const data = await loadAsset(id)
		// 	res.send(data)
		// })

		// app.get('/unfurl', async (req, res) => {
		// 	const url = (req.query as any).url as string
		// 	res.send(await unfurl(url))
		// })
	})

	app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
		if (err) {
			console.error(err)
			process.exit(1)
		}

		console.log(`Server started on port ${PORT}`)
	})
}

main()
