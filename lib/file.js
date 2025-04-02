import {
  query,
  update,
  sparqlEscapeUri,
  sparqlEscapeInt,
  sparqlEscapeString,
  sparqlEscapeDateTime,
  uuid,
} from 'mu';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { parseSparqlResults } from './util';
import { FILE_RESOURCE_BASE_URI, STORAGE_PATH } from '../cfg';

/**
 * @param {string} id The id of the file to retrieve
 * @returns {Promise<any>} A record containing the id, name, extension and uris
 * @throws if file could not be found in metadata
 */
async function getFile(id) {
  const q = `PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
PREFIX dbpedia: <http://dbpedia.org/ontology/>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX subm: <http://mu.semte.ch/vocabularies/ext/submissions/>

SELECT DISTINCT (?virtualFile AS ?uri) (?physicalFile AS ?physicalUri) (?uuid as ?id) ?name ?extension ?isDraftFile
WHERE {
    ?virtualFile a ?type ;
        mu:uuid ${sparqlEscapeString(id)} ;
        mu:uuid ?uuid .
    ?physicalFile a ?type ;
        nie:dataSource ?virtualFile .
    ?virtualFile nfo:fileName ?name .
    ?virtualFile dbpedia:fileExtension ?extension .
    BIND((?type = subm:VoorlopigBestand) AS ?isDraftFile)
}`;
  const result = await query(q);
  const [file] = parseSparqlResults(result);
  if (!file?.id) {
    throw new Error('could not find file to convert');
  }
  file.isDraftFile = file.isDraftFile === '0'
    ? false
    : file.isDraftFile === '1'
    ? true
    : false
  return file;
}

/**
 * @param {VirtualFile} file The file that should be persisted in the database
 * @param {boolean} isDraftFile
 * @returns {Promise}
 */
async function createFile (file, isDraftFile) {
  const type = isDraftFile ? 'subm:VoorlopigBestand' : 'nfo:FileDataObject';

  const q = `PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>
PREFIX dbpedia: <http://dbpedia.org/ontology/>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/01/19/nie#>
PREFIX subm: <http://mu.semte.ch/vocabularies/ext/submissions/>

INSERT DATA {
  ${sparqlEscapeUri(file.uri)} a ${type} ;
    nfo:fileName ${sparqlEscapeString(file.name)} ;
    mu:uuid ${sparqlEscapeString(file.id)} ;
    dct:format ${sparqlEscapeString(file.format)} ;
    nfo:fileSize ${sparqlEscapeInt(file.size)} ;
    dbpedia:fileExtension ${sparqlEscapeString(file.extension)} ;
    dct:created ${sparqlEscapeDateTime(file.created)} ;
    dct:modified ${sparqlEscapeDateTime(file.created)} .
  ${sparqlEscapeUri(file.physicalFile.uri)} a ${type} ;
    nie:dataSource ${sparqlEscapeUri(file.uri)} ;
    nfo:fileName ${sparqlEscapeString(file.physicalFile.name)} ;
    mu:uuid ${sparqlEscapeString(file.physicalFile.id)} ;
    dct:format ${sparqlEscapeString(file.physicalFile.format)} ;
    nfo:fileSize ${sparqlEscapeInt(file.physicalFile.size)} ;
    dbpedia:fileExtension ${sparqlEscapeString(file.physicalFile.extension)} ;
    dct:created ${sparqlEscapeDateTime(file.physicalFile.created)} ;
    dct:modified ${sparqlEscapeDateTime(file.physicalFile.created)} .
}`;
  await update(q);
};

/**
 * @param {string} sourceFileUri
 * @param {string} derivedFileUri
 * @return {Promise}
 */
async function setFileSource(sourceFileUri, derivedFileUri) {
  const q = `PREFIX prov: <http://www.w3.org/ns/prov#>

INSERT DATA {
  ${sparqlEscapeUri(derivedFileUri)} prov:hadPrimarySource ${sparqlEscapeUri(sourceFileUri)} .
}`;
  await update(q);
}

/**
 * Store the file contained in the responseBody on disk and persist its metadata
 * in the database.
 *
 * @param {string} fileName
 * @param {ReadableStream} responseBody
 * @param {boolean} isDraftFile
 * @returns {Promise<VirtualFile>}
 */
async function storeFile(fileName, responseBody, isDraftFile) {
  const now = new Date();
  const physicalUuid = uuid();
  const physicalName = `${physicalUuid}.pdf`
  const filePath = `${STORAGE_PATH}/${physicalName}`;


  const readStream = Readable.fromWeb(responseBody);
  const writeStream = fs.createWriteStream(filePath);
  await finished(readStream.pipe(writeStream));

  const fileSize = fs.statSync(filePath).size;

  const physicalFile = {
    id: physicalUuid,
    uri: filePath.replace('/share/', 'share://'),
    name: physicalName,
    extension: "pdf",
    size: fileSize,
    created: now,
    format: "application/pdf",
  };

  const virtualUuid = uuid();
  const file = {
    id: virtualUuid,
    uri: `${FILE_RESOURCE_BASE_URI}/${virtualUuid}`,
    name: fileName,
    extension: "pdf",
    size: fileSize,
    created: now,
    format: "application/pdf",
    physicalFile,
  };
  await createFile(file, isDraftFile);
  return file;
}
export {
  getFile,
  storeFile,
  setFileSource,
}
