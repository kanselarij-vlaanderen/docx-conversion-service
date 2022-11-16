from datetime import datetime
import os.path
from flask import g, json, request, make_response, redirect
from helpers import logger, generate_uuid
from sudo_query import query, update # !
from .config import UNOSERVER_HOST, UNOSERVER_PORT, FILE_RESOURCE_BASE_URI, JSONAPI_FILES_TYPE
from lib.query_util import result_to_records
from lib.file import construct_insert_file_query, \
    construct_get_file_query, \
    construct_get_file_by_id, \
    shared_uri_to_path, \
    file_to_shared_uri
from lib.file_provenance import construct_set_file_source
from unoserver import converter


TEMPORARY_SUDO_GRAPH = "http://mu.semte.ch/graphs/organizations/kanselarij"

# Note that using a "/share" path here assumes that the share subfolder is the same between unoserver and file converter ...
conv = converter.UnoConverter(UNOSERVER_HOST, UNOSERVER_PORT)

@app.route("/files/<file_id>/convert", methods = ["POST"])
def pieces_get(file_id):
    file_uri = result_to_records(query(construct_get_file_by_id(file_id, TEMPORARY_SUDO_GRAPH)))[0]["uri"]
    file_details = result_to_records(query(construct_get_file_query(file_uri, TEMPORARY_SUDO_GRAPH)))[0]

    src_path = shared_uri_to_path(file_details["physicalFile"])
    target_uuid = generate_uuid()
    target_ext, target_mime = "pdf", "application/pdf"
    target_filename = target_uuid + "." + target_ext
    target_uri = file_to_shared_uri(target_filename)
    target_path = shared_uri_to_path(target_uri)

    conv.convert(inpath=src_path, outpath=target_path, convert_to=target_ext)

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
    update(construct_insert_file_query(file, physical_file, TEMPORARY_SUDO_GRAPH))
    update(construct_set_file_source(file["uri"], file_uri, TEMPORARY_SUDO_GRAPH))

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
