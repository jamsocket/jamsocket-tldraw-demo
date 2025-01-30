import { Jamsocket } from '@jamsocket/server'

const JAMSOCKET_ACCOUNT = process.env.JAMSOCKET_ACCOUNT
const JAMSOCKET_SERVICE = process.env.JAMSOCKET_SERVICE
const JAMSOCKET_TOKEN = process.env.JAMSOCKET_TOKEN
const JAMSOCKET_DEV = process.env.JAMSOCKET_DEV

let jamsocket: Jamsocket
if (JAMSOCKET_DEV) {
  jamsocket = new Jamsocket({
    dev: true,
  })
} else {
  if (!JAMSOCKET_ACCOUNT || !JAMSOCKET_SERVICE || !JAMSOCKET_TOKEN) {
    throw new Error(
      'Missing environment variables JAMSOCKET_ACCOUNT, JAMSOCKET_SERVICE, or JAMSOCKET_TOKEN. ' +
        'If you intend to run in local dev mode, set JAMSOCKET_DEV=true.',
    )
  }

  jamsocket = new Jamsocket({
    account: JAMSOCKET_ACCOUNT,
    service: JAMSOCKET_SERVICE,
    token: JAMSOCKET_TOKEN,
  })
}

export async function POST(request: Request) {
  const { docId } = await request.json()
  if (typeof docId !== 'string') {
    return Response.json({ error: 'docId is required in body' }, { status: 400 })
  }

  // This is a good place to check if the user has permissions
  // to access the document! If they don't, you should return a 403 error here.
  // For the sample code, we are assuming that every user can access every document.

  const spawnResult = await jamsocket.connect({
    key: docId,
    spawn: {
      executable: {
        env: {
          STORAGE_BUCKET: 'tldraw-jamsocket-demo',
          STORAGE_PREFIX: docId,
          // We recommend using Jamsocket's AWS integration in production, rather than
          // passing credentials in as env vars, but it can be useful for testing.
          // AWS_ACCESS_KEY_ID: '',
          // AWS_SECRET_ACCESS_KEY: '',
        },
      },
    },
  })

  return Response.json(spawnResult)
}
