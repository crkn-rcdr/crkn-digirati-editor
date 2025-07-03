async function triggerWindmillJob(windmill, slug) {
  const body = JSON.stringify({slug});
  const endpoint = `https://windmill-crkn-rcdr.canadiana.ca/api/w/prod/jobs/run/f/f/pres_api_setup/import_flow`;
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
		  "Content-Type": "application/json",
		  "Authorization": "Bearer " + windmill
		},
    body
  });
}
module.exports = {
  triggerWindmillJob
};