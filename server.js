// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var request = require("request");
var mongo = require("mongodb").MongoClient;

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.use("/api/imagesearch/", function (req, res) {
  
  // URL to get information through Google API
  var baseUrl = "https://content.googleapis.com/customsearch/v1?searchType=image&q=";
  var quesIndex = req.url.indexOf("?");
  var query = req.url.substring(1, quesIndex);
  var offset = parseInt(req.query.offset);
  
  // Make an HTTPS request
  request(baseUrl + query +  "&num=" + offset +  "&cx=" + 
          process.env.CSE_ID + "&key=" + process.env.API_KEY, function(err, resp, body) {
		if (err) throw err;
		
    body = JSON.parse(body);
		
    // Parse the data from the request
		var json = [];
		var numRes = body.items.length;

    for (var i = 0; i < numRes; i++) {
			var img = body.items[i];
			json.push({
				"url": img.link,
				"snippet": img.snippet,
				"thumbnail": img.image.thumbnailLink,
				"context": img.image.contextLink
			});
		}

		res.end(JSON.stringify(json));
	});
  
  // insert the query into the database
  mongo.connect(process.env.MONGO, function(err, db) {
    var collection = db.collection("imageApi");
    
    collection.insert({"query": decodeURIComponent(query), "when": new Date()});
  });
});

// Show last 10 searches
app.use("/api/latest/imagesearch/", function(req, res) {
  mongo.connect(process.env.MONGO, function(err, db) {
    var collection = db.collection("imageApi");
    
    // show last 10 searches by extraction and sorting data from database.
    collection.find(null, {"query": 1, "when": 1, "_id": 0}).sort({$natural: -1}).limit(10).toArray(function(err, data) {
      res.end(JSON.stringify(data));
    });
    
  });
});

app.use("/", function(req, res) {
  res.sendFile(__dirname + '/views/index.html');
})

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
