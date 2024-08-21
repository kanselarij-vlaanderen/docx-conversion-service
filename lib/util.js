function parseSparqlResults(data) {
  if (!data) return;
  const vars = data.head.vars;
  return data.results.bindings.map((binding) => {
    const obj = {};
    vars.forEach((varKey) => {
      if (binding[varKey]) {
        obj[varKey] = binding[varKey].value;
      }
    });
    return obj;
  });
};

async function execWithRetry(fun) {
  try {
    return await fun();
  } catch (err) {
    console.log('Something went wrong while performing an external request, waiting for 5 seconds and retrying once');
    console.log(err);
    await new Promise((r) => setTimeout(r, 5000));
    return await fun();
  }
}

export {
  parseSparqlResults,
  execWithRetry,
}
