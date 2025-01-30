import App from '@/components/App'
import DocIdSetter from '../components/DocIdSetter'

function randomDocId() {
  return Math.random().toString(36).substring(2, 15)
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams
  let docId = searchParams.docId
  if (typeof docId !== 'string') {
    console.log('No docId found in URL. Generating a random one.')
    docId = randomDocId()
  }

  return (
    <>
      <App roomId={docId} />
      <DocIdSetter docId={docId} />
    </>
  )
}
