const axios = require('axios')
/**
 * Write DC - Save to API (save on Mary API)

Access Platform -- new task: 
create function in admin tools canvas - foreach image file upload and process into jp2, mint noid, and save on swift...
and create an access object with the canvas ids using access platform manifest create...
return canteloupe urls

then:
replace all image urls with canteloupe urls in manifest json

then:
update manifest cache

then: 
send manifest cache json to mary API

[then work with mary on how to send requests from my app to hers]

*/
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