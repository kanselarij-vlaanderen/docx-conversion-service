import os
from string import Template
from escape_helpers import sparql_escape_uri, sparql_escape_string, sparql_escape_int, sparql_escape_datetime

MU_APPLICATION_GRAPH = os.environ.get("MU_APPLICATION_GRAPH")

def construct_set_file_source(new_file, source_file, graph=MU_APPLICATION_GRAPH):
    query_template = Template("""
PREFIX prov: <http://www.w3.org/ns/prov#>

INSERT DATA {
    GRAPH $graph {
        $new_file prov:hadPrimarySource $source_file .
    }
}
""")
    return query_template.substitute(
        graph=sparql_escape_uri(graph),
        new_file=sparql_escape_uri(new_file),
        source_file=sparql_escape_uri(source_file))
