import { RoomSnapshot, TLSocketRoom } from '@tldraw/sync-core'
import { readFromS3, writeToS3 } from './persist'

const DOC_FILENAME = 'tldraw-doc.json'

interface RoomState {
  room: TLSocketRoom
  needsPersist: boolean
}

export async function getRoomState(): Promise<RoomState> {
  let initialSnapshotJson = await readFromS3(DOC_FILENAME)

  let initialSnapshot: RoomSnapshot | undefined
  if (initialSnapshotJson) {
    initialSnapshot = JSON.parse(initialSnapshotJson.toString('utf-8')) as RoomSnapshot
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
    writeToS3(DOC_FILENAME, JSON.stringify(snapshot))
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
