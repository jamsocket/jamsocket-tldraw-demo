# tldraw × Jamsocket demo

## Installing

In `client` and `server`: `npm i`

## Running locally

In `client`:

    JAMSOCKET_DEV=true npm run dev

In `server`:

    npx jamsocket dev

## Deploying

To deploy the service, create a [Jamsocket](https://jamsocket.com) account.

Throught the [Jamsocket web app](https://app.jamsocket.com) or the CLI, create a service (in this example, called `tldraw`):

```bash
npx jamsocket service create tldraw
```

Build and upload the server code to Jamsocket (note: requires [Docker](https://docker.com)):

```bash
cd server
npx jamsocket push tldraw -f ./Dockerfile
```

Deploy the client using a service that supports deploying Next.js from a git repo, like Vercel or Netlify. Set these environment variables:

- `JAMSOCKET_ACCOUNT` - your Jamsocket account name (not email)
- `JAMSOCKET_SERVICE` - the name of your service, e.g. `tldraw` if you followed the example above
- `JAMSOCKET_TOKEN` - a Jamsocket access token. You can create one on the settings page of the Jamsocket web app

To persist data on S3, you must pass in `AWS_SECRET_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables. These can be passed in the
environment when spawning (see `client/src/app/page.tsx`), but the recommended way is to use Jamsocket's new (beta) S3 integration. Reach out to
hi@jamsocket.com for instructions on enabling this.

### Automating deploys from GitHub

This git repo includes a workflow for automatically building and pushing to Jamsocket. To use it, clone this repo and set the same 
`JAMSOCKET_*` environment variables as for Vercel.
