import { app, errorHandler } from "mu";
import fs from "fs";
import { CronJob } from "cron";
import { FILE_JSONAPI_TYPE, STATUS_POLLING_CRON_PATTERN } from "./cfg";
import { getFile, setFileSource, storeFile } from "./lib/file";
import { execWithRetry } from "./lib/util";
import { deleteFile, downloadPdf, uploadFile, checkDefaultDrive } from "./lib/graph-api";
import { createEmailOnFailure } from './lib/email';

new CronJob(
	STATUS_POLLING_CRON_PATTERN,
	() => {
    console.log(`Checking Site_id status triggered by cron job at ${new Date().toISOString()}`);
    pollDefaultDrive();
  }, // onTick
	null, // onComplete
	true, // start
);

app.post("/files/:id/convert", async (req, res, next) => {
  try {
    const fileId = req.params.id;
    const file = await getFile(fileId);
    file.path = file.physicalUri.replace("share://", "/share/");

    const stats = fs.statSync(file.path);
    file.size = stats.size;
    const readStream = fs.createReadStream(file.path);
    
    // If this fails this crashes the app if not caught.
    readStream.on('error', function(err) {
      console.log(`Error reading readStream: ${err.message}`);
      // silence service crashing error, throwing here crashes
      console.trace(err);
    });

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
    console.trace(err);
    return next({ message: JSON.stringify(err.message), status: 500 });
  }
});

async function pollDefaultDrive() {
  try {
    await checkDefaultDrive();
    console.log('Default drive ok');
  } catch(e) {
    console.error("Default drive is not ok, document conversions will fail");
    await createEmailOnFailure(
      "The default drive is unreachable in docx-conversion",
      `environment: NA, site is same for both\t\nDetail of error: ${e?.message || "no details available"}\t\n
      Docx conversions will no longer work with this site_id!`
    );
  }
}

app.use(errorHandler);

// check once on start, further checks based on cronjob
pollDefaultDrive();
