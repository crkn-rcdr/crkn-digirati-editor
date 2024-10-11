this.authWindow = new BrowserWindow(
	{
		alwaysOnTop : true, // keeps this window on top of others
		webPreferences : {
			nodeIntegration  : false, // again, don't need to specify these if Electron v4+ but showing for demo
			contextIsolation : true // we can isolate this window
		}
	}
)

this.authWindow.on('closed', () => {
	this.authWindow = null
})

authWindow.loadURL(`
	https://login.microsoftonline.com/${config.auth.tenantId}/oauth2/authorize?
		client_id=${config.auth.clientId}
		&response_type=code
		&redirect_uri=http://${config.auth.protocol}:${config.auth.port}
		&response_mode=query
		&resource=${config.auth.resource}
`)

authWindow.webContents.on('did-finish-load', () => {
	session.defaultSession.webRequest.onCompleted({ urls: [`http://${config.express.protocol}:${config.express.port}/?code=` + '*'] }, details => {
		const _url        = details.url.split('?')[1] // get the equivalent of window.location.search for the URLSearchParams to work properly
		const _params     = new URLSearchParams(_url)
		const _accessCode = _params.get('code')

		if (_accessCode) {
			const tokenRequestUrl = `https://login.microsoftonline.com/${config.auth.tenantId}/oauth2/token`

			const tokenRequestBody = {
				grant_type    : 'authorization_code',
				client_id     : config.auth.clientId,
				code          : _accessCode,
				redirect_uri  : `http://${config.express.protocol}:${config.express.port}`,
				resource      : config.auth.resource
			}

			request.post(
				{ url: tokenRequestUrl, form: tokenRequestBody },
				(err, httpResponse, body) => {
					if (!err) {
						console.log('Token Received!\n', body)
					} else {
						// Probably throw an error?	
					}
				}
			)
		} else {
		  // Probably throw an error?	
		}
	})
})
