import { app, errorHandler } from 'mu';
import fs from 'fs';
import { StreamUpload, LargeFileUploadTask } from "@microsoft/microsoft-graph-client";
import { FILE_JSONAPI_TYPE, USER_ID, MS_GRAPH_CLIENT as client } from './cfg';
import { getFile, setFileSource, storeFile } from './lib/file';


app.get('/', function(_req, res) {
  res.send('Hello mu-javascript-template');
});

app.post('/files/:id/convert', async (req, res) => {
  const fileId = req.params.id;
  const file = await getFile(fileId);
  file.path = file.physicalUri.replace('share://', '/share/');

  try {
    const uploadSessionPayload = {
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
      },
    }
    const uploadSession = await LargeFileUploadTask.createUploadSession(
      client,
      `/users/${USER_ID}/drive/root:/${file.id}.${file.extension}:/createUploadSession`,
      uploadSessionPayload,
    );
    const stats = fs.statSync(file.path);
    const fileSize = stats.size;
    const readStream = fs.createReadStream(file.path);
    const fileObject = new StreamUpload(readStream, file.name, fileSize);
    const options = {
      rangeSize: 327680,
      uploadEventHandlers: {
        progress: (range) => {
          console.info(
            `Progress uploading file <${file.uri}>. Bytes: [${range.minValue}, ${range.maxValue}]`
          )
        }
      },
    };
    const uploadTask = new LargeFileUploadTask(client, fileObject, uploadSession, options);
    await uploadTask.upload();
  } catch (err) {
    console.log(`Error uploading file: ${JSON.stringify(err)}`);
    console.error(err);
  }

  const buffer = await client
        .api(`/users/${USER_ID}/drive/root:/${file.id}.${file.extension}:/content?format=pdf`)
        .get();

  const newFile = await storeFile(`${file.id}.pdf`, buffer);
  await setFileSource(file.uri, newFile.uri);

  await client
    .api(`/users/${USER_ID}/drive/root:/${file.id}.${file.extension}`)
    .delete();

  return res
    .status(200)
    .send({
      data: [{
        type: FILE_JSONAPI_TYPE,
        id: newFile.id,
        attributes: {
          uri: newFile.uri,
        }
      }]
    });
});

app.use(errorHandler);
