import { app, errorHandler } from "mu";
import fs from "fs";
import { FILE_JSONAPI_TYPE } from "./cfg";
import { getFile, setFileSource, storeFile } from "./lib/file";
import { execWithRetry } from "./lib/util";
import { deleteFile, downloadPdf, uploadFile } from "./lib/graph-api";

app.post("/files/:id/convert", async (req, res, next) => {
  const fileId = req.params.id;
  const file = await getFile(fileId);
  file.path = file.physicalUri.replace("share://", "/share/");

  try {
    const stats = fs.statSync(file.path);
    file.size = stats.size;
    const readStream = fs.createReadStream(file.path);

    await execWithRetry(() => uploadFile(file, readStream));

    const buffer = await execWithRetry(() => downloadPdf(file));

    const newFile = await storeFile(`${file.id}.pdf`, buffer, file.isDraftFile);
    await setFileSource(file.uri, newFile.uri);

    await execWithRetry(() => deleteFile(file));

    return res.status(200).send({
      data: [
        {
          type: FILE_JSONAPI_TYPE,
          id: newFile.id,
          attributes: {
            uri: newFile.uri,
          },
        },
      ],
    });
  } catch (err) {
    console.log(`Error converting DOCX file: ${err.message}`);
    return next({ message: JSON.stringify(err.message), status: 500 });
  }
});

app.use(errorHandler);
