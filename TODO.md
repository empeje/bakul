In Javanese, "bakul" refers to a woven bamboo basket or container. In the world of AI, it is not uncommon for you to ask AI to generate data, e.g., produce a CSV or table-like dataset. At the same time, it is also not uncommon for you to ask it to make a visualization using an Artifact-like method, e.g., in Claude you can ask it to make a React or HTML artifact. The problem is those CSVs and the Artifacts are not connected. The idea behind the invention of Bakul is to introduce a missing storage layer for AI chatbots.

This project specifically focuses on the API layer, and in a separate project we will implement the MCP.

This project will not have any UI except for a landing page. So in this project it will contain:

- `/` root is the landing page which shows how it works
- `/api` is the namespace for API

The API in this project will implement the following protocol:

- Registration: given a username and password, we can register a user and in return provide an `API key` and instructions on how to install the MCP (can be a placeholder for now). The user uses the API key as input to the MCP. There will be no login in this API, but there will be a way to rotate the key to simplify the app.
- Rotate key: assuming the API key is correct, the user can rotate their key and invalidate the old one.
- Create dataset: (requires authentication & authorization / valid API Key) this step allows us to make a namespace for user data in JSON (backed by Cloudflare D1). When creating datasets, it will return a `datasetId` and a public JSON GET API `/api/datasets/{username}/{id}`.
- Retrieve dataset: `/api/datasets/{username}/{id}` - a read-only API to read the dataset, and it's public.
- Retrieve dataset schema: `/api/datasets/{username}/{id}/schema` - a read-only API to read the dataset schema, and it's public.
- Update dataset: replace-based API to replace the dataset with a new one (only the owner can replace data).

Recommended implementation:
- User registers
- User then makes a dataset
- User does research using AI and makes a CSV
- User then asks AI to dump the CSV using `create dataset`
- User then asks AI to make a dashboard that uses the dataset URL that returns JSON; also tell AI that they can use get dataset for getting the schema
- Now user gets a very nice UI with data
- If needed, user can update the UI

For now, let's make the API. Additionally, it should also implement Swagger UI.

The app is a Hono + Cloudflare Worker app.