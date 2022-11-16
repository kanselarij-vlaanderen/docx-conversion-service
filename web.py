from datetime import datetime
import os.path
from flask import g, json, request, make_response, redirect
from helpers import logger, generate_uuid, query, update, error
from .config import UNOSERVER_HOST, UNOSERVER_PORT, FILE_RESOURCE_BASE_URI, JSONAPI_FILES_TYPE
from lib.query_util import result_to_records
from lib.file import construct_insert_file_query, \
    construct_get_file_query, \
    construct_get_file_by_id, \
    shared_uri_to_path, \
    file_to_shared_uri
from lib.file_provenance import construct_set_file_source
from unoserver import converter

# Note that using a "/share" path here assumes that the share subfolder is the same between unoserver and file converter ...
conv = converter.UnoConverter(UNOSERVER_HOST, UNOSERVER_PORT)

@app.route("/files/<file_id>/convert", methods = ["POST"])
def convert_file(file_id):
    try:
        file_uri = result_to_records(query(construct_get_file_by_id(file_id)))[0]["uri"]
    except (IndexError, KeyError):
        return error("Source file not found", 404, detail=f"No file was found for id {file_id}")

    file_details = result_to_records(query(construct_get_file_query(file_uri)))[0]
    
    # Sometimes, the file service is unable to determine a more precise MIME type,
    # so we also want to support octet-stream
    supported_mime_types = [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    ]
    src_mime = file_details["mimeType"]
    if not any(mime_type in src_mime for mime_type in supported_mime_types):
        return error("Unsupported source file MIME type", 400, detail=f"Cannot convert file with id {file_id} because it has an unspported MIME type. MIME type of file: {src_mime}. Supported MIME types: {','.join(supported_mime_types)}")

    src_path = shared_uri_to_path(file_details["physicalFile"])
    target_uuid = generate_uuid()
    target_ext, target_mime = "pdf", "application/pdf"
    target_filename = target_uuid + "." + target_ext
    target_uri = file_to_shared_uri(target_filename)
    target_path = shared_uri_to_path(target_uri)

    try:
        conv.convert(inpath=src_path, outpath=target_path, convert_to=target_ext)
    except Exception as e:
        logger.warn(f"Converting {src_path} to PDF threw an exception. Sending 400 to client. Exception traceback:")
        logger.exception(e)
        return error("Conversion failed", 400, detail=f"Conversion of file with id {file_id} failed")

    file = {
        "uuid": generate_uuid(),
        "name": file_details["name"].replace(file_details["extension"], target_ext),
        "mimetype": target_mime,
        "created": datetime.utcfromtimestamp(os.path.getmtime(target_path)),
        "size": os.path.getsize(target_path),
        "extension": target_ext
    }
    file["uri"] = f"{FILE_RESOURCE_BASE_URI.rstrip('/')}/{file['uuid']}"
    physical_file = {
        "uri": target_uri,
        "uuid": target_uuid,
        "name": target_filename
    }
    update(construct_insert_file_query(file, physical_file))
    update(construct_set_file_source(file["uri"], file_uri))

    data = [{
        "type": JSONAPI_FILES_TYPE,
        "id": file["uuid"],
        "attributes": {
            "uri": file["uri"]
        }
    }]
    res = make_response({ "data": data }, 200)
    res.headers["Content-Type"] = "application/vnd.api+json"
    return res
