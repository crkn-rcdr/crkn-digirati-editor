/**
 *  https://access.canadiana.ca/api/dipstaging.requestSmelt?batch=1
 * 
 * cookie:
_ga_9MEKBNRXBK=GS1.1.1712321456.3.1.1712321871.0.0.0; _ga_BXLT3YT74C=GS1.1.1716496922.2.1.1716496923.0.0.0; lang=en; _ga_3WDYMY4NVB=GS1.1.1725390218.20.1.1725393837.0.0.0; _ga_F2YBYPBWM5=GS1.1.1728494233.36.1.1728494279.0.0.0; _gid=GA1.2.213722618.1728657686; _ga=GA1.1.906133601.1710429968; _ga_KEG217QJW8=GS1.1.1728657685.115.1.1728657710.0.0.0; auth_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F1dGguY2FuYWRpYW5hLmNhLyIsInN1YiI6IjA5ZTk2NjYyLWJkMjAtNGQ3Zi04ODlkLTIzZDNhNjU0ZDMzMSIsIm5hbWUiOiJCcml0dG55IExhcGllcnJlIiwiZW1haWwiOiJibGFwaWVycmVAY3Jrbi5jYSIsImp0aSI6IjQwYjFkNWU4LTU0MWYtNDhmMy05MjhiLTAxM2Y5YmM2NWUzOCIsImlhdCI6MTcyODY2NzUyMSwiZXhwIjoxNzI4NzEwNzIxfQ.yRgTLJ-FrPntwDDXn-i4EfA-g5leEOmjkqV_ES3WrmM
 * **/
module.exports = function legacyIngestTrigger(slug) {
    return db.atomic("access", "requestSmelt", slug, {
        user : {
            name : "Manifest Editor",
            email: "blapierre@crkn.ca"
        },
        id : slug,
        slug: slug
      })
}