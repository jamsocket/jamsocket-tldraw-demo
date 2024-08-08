import App from "@/components/App";
import Jamsocket, { JamsocketInstance } from '@jamsocket/server'
import DocIdSetter from "../components/DocIdSetter";

const JAMSOCKET_ACCOUNT = process.env.JAMSOCKET_ACCOUNT;
const JAMSOCKET_SERVICE = process.env.JAMSOCKET_SERVICE;
const JAMSOCKET_TOKEN = process.env.JAMSOCKET_TOKEN;
const JAMSOCKET_DEV = process.env.JAMSOCKET_DEV;

let jamsocket: JamsocketInstance;
if (JAMSOCKET_DEV) {
  jamsocket = Jamsocket.init({
    dev: true,
  })
} else {
  if (!JAMSOCKET_ACCOUNT || !JAMSOCKET_SERVICE || !JAMSOCKET_TOKEN) {
    throw new Error(
      'Missing environment variables JAMSOCKET_ACCOUNT, JAMSOCKET_SERVICE, or JAMSOCKET_TOKEN. ' +
      'If you intend to run in local dev mode, set JAMSOCKET_DEV=true.'
    )
  }

  jamsocket = Jamsocket.init({
    account: JAMSOCKET_ACCOUNT,
    service: JAMSOCKET_SERVICE,
    token: JAMSOCKET_TOKEN,
  })
}

type Props = {
  searchParams: Record<string, string>
}

function randomDocId() {
  return Math.random().toString(36).substring(2, 15);
}

export default async function Home({ searchParams }: Props) {
  let docId = searchParams.docId || randomDocId();

  // This code runs on the server. It's a good place to check if the user has permissions
  // to access the document! If they don't, you can return a 403 error here.
  // For the sample code, we are assuming that every user can access every document.
  
  const spawnResult = await jamsocket.spawn({
    lock: docId,
    env: {
      STORAGE_BUCKET: 'tldraw-jamsocket-demo',
      STORAGE_PREFIX: docId,
      // We recommend using Jamsocket's AWS integration in production, rather than
      // passing credentials in as env vars, but it can be useful for testing.
      // AWS_ACCESS_KEY_ID: '',
      // AWS_SECRET_ACCESS_KEY: '',
    }
  })

  console.log('spawnResult', spawnResult, 'docId', docId)

  const serverUrl = spawnResult.url.replace(/\/$/, '');

  return (
    <>
      <App server={serverUrl} roomId={docId} />
      <DocIdSetter docId={docId} />
    </>
  );
}
