var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var url = require('url');
const express = require('express');
const app = express();

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';

credentials = JSON.parse(fs.readFileSync('client_secret.json'));

var clientSecret = credentials.installed.client_secret;
var clientId = credentials.installed.client_id;
var redirectUrl = credentials.installed.redirect_uris[0];
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

app.get('/', function (req, res) {
  res.redirect(getAuthURL(oauth2Client))
});

app.get('/auth/google/callback', function (req, res) {
  var query = url.parse(req.url, true).query;
  var code = query.code;
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    res.send(listLabels(oauth2Client))
  });

});

function getAuthURL() {
  authUrl = oauth2Client.generateAuthUrl({
    // access_type: 'offline',
    scope: SCOPES
  });
  return authUrl;
}

function listLabels(auth) {
  var gmail = google.gmail('v1');
  return gmail.users.labels.list({
    auth: auth,
    userId: 'me'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var labels = response.labels;
    if (labels.length == 0) {
      console.log('No labels found.');
    } else {
      console.log('Labels:');
      for (var i = 0; i < labels.length; i++) {
        var label = labels[i];
        console.log('- %s', label.name);
      }
    }
  });
}


app.listen(8080, function () {
  console.log('UP AND RUNNING')
});





