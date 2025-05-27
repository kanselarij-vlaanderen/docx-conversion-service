import {
  StreamUpload,
  LargeFileUploadTask,
} from "@microsoft/microsoft-graph-client";
import { SITE_ID, MS_GRAPH_CLIENT as client } from "../cfg";

async function uploadFile(file, fileStream) {
  const uploadSessionPayload = {
    item: {
      "@microsoft.graph.conflictBehavior": "rename",
    },
  };
  const uploadSession = await LargeFileUploadTask.createUploadSession(
    client,
    `/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}:/createUploadSession`,
    uploadSessionPayload,
  );
  const options = {
    rangeSize: 327680,
    uploadEventHandlers: {
      progress: (range) => {
        console.info(
          `Progress uploading file <${file.uri}>. Bytes: [${range.minValue}, ${range.maxValue}]`,
        );
      },
    },
  };
  const fileObject = new StreamUpload(fileStream, file.name, file.size);
  const uploadTask = new LargeFileUploadTask(
    client,
    fileObject,
    uploadSession,
    options,
  );
  await uploadTask.upload();
}

async function downloadPdf(file) {
  return await client
    .api(
      `/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}:/content?format=pdf`,
    )
    .get();
}

async function deleteFile(file) {
  await client
    .api(`/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}`)
    .delete();
}

async function checkDefaultDrive() {
  return await client
    .api(
      `/sites/${SITE_ID}/drive`,
    )
    .get();
}

export {
  uploadFile,
  downloadPdf,
  deleteFile,
  checkDefaultDrive,
}
