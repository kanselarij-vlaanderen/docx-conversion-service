import "isomorphic-fetch"; // Needed for microsoft-graph-client to work
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";
import fs from 'fs';

function isTruthy(value) {
  return [true, "true", 1, "1", "yes", "Y", "on"].includes(value);
}

function rstrip(value, strippedCharacters) {
  let end = value.length - 1;
  while (strippedCharacters.includes(value.charAt(end)))
    end -= 1;
  return value.substr(0, end + 1);
}

// Env vars
const SITE_ID = process.env.SITE_ID;
const TENANT_ID = process.env.TENANT_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const GRAPH_CLIENT_DEBUG_LOGGING = isTruthy(process.env.GRAPH_CLIENT_DEBUG_LOGGING);
const STATUS_POLLING_CRON_PATTERN = process.env.STATUS_POLLING_CRON_PATTERN || '0 0 7 * * *'; 
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@kaleidos.vlaanderen.be';
const EMAIL_TO_ADDRESS_ON_FAILURE = process.env.EMAIL_TO_ADDRESS_ON_FAILURE ?? '';

const RESOURCE_BASE_URI  = 'http://themis.vlaanderen.be';
const EMAIL_GRAPH_URI = "http://mu.semte.ch/graphs/system/email";
const EMAIL_OUTBOX_URI = "http://themis.vlaanderen.be/id/mail-folders/d9a415a4-b5e5-41d0-80ee-3f85d69e318c";

const RELATIVE_STORAGE_PATH = rstrip(process.env.MU_APPLICATION_FILE_STORAGE_PATH ?? "converted-docx", "/")
const STORAGE_PATH = `/share/${RELATIVE_STORAGE_PATH}`;
if (!fs.existsSync(STORAGE_PATH)){
    fs.mkdirSync(STORAGE_PATH);
}

const FILE_RESOURCE_BASE_URI = rstrip(process.env.FILE_RESOURCE_BASE_URI ?? "http://themis.vlaanderen.be/id/bestand", "/")
const FILE_JSONAPI_TYPE = process.env.FILE_JSONAPI_TYPE ?? "files"

if ([
  SITE_ID,
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET
].some((envVar) => envVar === undefined)) {
  console.warn(
    "Required environment variables were not set. Execution cannot proceed, logging variables and exiting."
  );
  console.warn(`SITE_ID: "${SITE_ID}"`);
  console.warn(`TENANT_ID: "${TENANT_ID}"`);
  console.warn(`CLIENT_ID: "${CLIENT_ID}"`);
  console.warn(`CLIENT_SECRET: "${CLIENT_SECRET}"`);
  process.exit(1);
}

const credential = new ClientSecretCredential(
  TENANT_ID,
  CLIENT_ID,
  CLIENT_SECRET
);
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ['https://graph.microsoft.com/.default'],
});
const MS_GRAPH_CLIENT = Client.initWithMiddleware({
  debugLogging: GRAPH_CLIENT_DEBUG_LOGGING,
  authProvider,
});

export {
  GRAPH_CLIENT_DEBUG_LOGGING,
  MS_GRAPH_CLIENT,
  SITE_ID,
  STORAGE_PATH,
  FILE_RESOURCE_BASE_URI,
  FILE_JSONAPI_TYPE,
  STATUS_POLLING_CRON_PATTERN,
  EMAIL_FROM_ADDRESS,
  EMAIL_TO_ADDRESS_ON_FAILURE,
  RESOURCE_BASE_URI,
  EMAIL_GRAPH_URI,
  EMAIL_OUTBOX_URI
}
