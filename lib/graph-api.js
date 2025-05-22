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
  console.log('uploaded the source file');
}

async function downloadPdf(file) {
  console.log('going to download the pdf file');
  return await client
    .api(
      `/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}:/content?format=pdf`,
    )
    .get();
}

async function deleteFile(file) {
  console.log('going to delete the file');
  // this is not what the API reference says, but it works?
  // api ref says: "POST /drives/{drive-id}/items/{item-id}/permanentDelete"
  await client.api(`/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}:/permanentDelete`)
    .post();

  // delete to trash bin, not wanted but maybe as backup somehow?
  // await client
  //   .api(`/sites/${SITE_ID}/drive/root:/${file.id}.${file.extension}`)
  //   .delete();
  console.log('file deleted');
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
