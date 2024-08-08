import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import { readFromS3, writeToS3 } from './persist'

interface RoomState {
	room: TLSocketRoom
	needsPersist: boolean
}

export async function getRoomState(): Promise<RoomState> {
	let initialSnapshotJson = await readFromS3() ?? undefined

	let initialSnapshot: RoomSnapshot | undefined
	if (typeof initialSnapshotJson === 'string') {
		initialSnapshot = JSON.parse(initialSnapshotJson) as RoomSnapshot
	}

	let roomState = {
		room: new TLSocketRoom({
			initialSnapshot,
			onSessionRemoved(room, args) {
				console.log('client disconnected', args.sessionId, 'default')
				if (args.numSessionsRemaining === 0) {
					console.log('closing room', 'default')
					room.close()
				}
			},
			onDataChange() {
				roomState.needsPersist = true
			},
		}),
		needsPersist: false,
	}

	async function saveSnapshot(snapshot: RoomSnapshot) {
		writeToS3(JSON.stringify(snapshot))
	}

	setInterval(() => {
		if (roomState.needsPersist) {
			// persist room
			roomState.needsPersist = false
			console.log('saving snapshot')
			saveSnapshot(roomState.room.getCurrentSnapshot())
		}
	}, 10_000)

	return roomState
}
