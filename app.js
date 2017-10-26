const fs = require('fs')
const readline = require('readline')
const google = require('googleapis')
const googleAuth = require('google-auth-library')
const url = require('url')
const express = require('express')
const app = express()
const airport_codes = require('airport-codes').toJSON();
const base64 = require('base64-js');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
  process.env.USERPROFILE) + '/.credentials/'
const TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json'

credentials = JSON.parse(fs.readFileSync('client_secret.json'))

const clientSecret = credentials.installed.client_secret
const clientId = credentials.installed.client_id
const redirectUrl = credentials.installed.redirect_uris[0]
const auth = new googleAuth()
const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl)
const gmail = google.gmail('v1')

app.get('/', (req, res) => {
  res.redirect(getAuthURL(oauth2Client))
})

app.get('/auth/google/callback', async (req, res) => {
  const query = url.parse(req.url, true).query
  const code = query.code
  await setToken(code)
  const messages = await getMessages()
  await getAttachment(messages) 
  console.log(messages)
  res.send(messages)
})

function getAuthURL () {
  authUrl = oauth2Client.generateAuthUrl({
    // access_type: 'offline',
    scope: SCOPES
  })
  return authUrl
}

function setToken (code) {
  return new Promise((resolve, reject) => {
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        throw new Error('Error while trying to retrieve access token', err)
      }

      oauth2Client.credentials = token
      resolve()
    })
  })
}

function getMessages () {
  return new Promise((resolve, reject) => {
    gmail.users.messages.list({
      q: '"flight" AND "confirmation" AND has:attachment pdf',
      auth: oauth2Client,
      userId: 'me'
    }, (err, response) => {
      if (err) {
        throw new Error('The API returned an error: ' + err)
      }
      const messages = response.messages
      resolve(messages)
    })
  })
}

function getAttachment (messages) {
  return new Promise((resolve, reject) => {
    messages.map(function(message) {
      gmail.users.messages.get({
        id: message.id,
        auth: oauth2Client,
        userId: 'me',
        format:'FULL'
      }, (err, response) => {
        if (err) {
          throw new Error('The API returned an error: ' + err)
        }
        response.payload.parts.map(function(att) {
          if (att.mimeType=='application/pdf') {
            gmail.users.messages.attachments.get({
              messageId: message.id,
              auth: oauth2Client,
              userId: 'me',
              id: att.body.attachmentId
            }, (err, response) => {
              if (err) {
                throw new Error('The API returned an error: ' + err)
              }
              fs.writeFileSync(att.filename, base64.toByteArray(response.data));
            }
            )

          }
        })
      })
    })

})};

app.listen(8080, function () {
  console.log('UP AND RUNNING')
})





