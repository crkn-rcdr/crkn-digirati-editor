const axios = require('axios')
module.exports = function legacyIngestTrigger(slug, AUTH_TOKEN) {
  return axios.post('https://access.canadiana.ca/api/dipstaging.requestSmelt?batch=1', {
    "0":
    {"user":
      {"name":"Manifest Editor","email":"blapierre@crkn.ca"},
      "id": slug,
      "slug": slug
    }},
    {
      headers: {
        Cookie: `auth_token=${AUTH_TOKEN}`, // Replace with your cookie value
      },
    })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    })
    return true
}