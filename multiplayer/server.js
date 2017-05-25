var fs = require('fs');
var http = require('http');
var url = require('url');

var turn = 'X';
var notify = null;

function clientRequest(request, response) {
	var parsedUrl = url.parse(request.url, true);
	var path = parsedUrl.pathname.substring(1);
	var args = parsedUrl.query;

	//console.log('Received request for: ' + path);

	if(path === '') {
		path = 'index.html';
	}

	var content = '404: Not found';
	if(path === 'taketurn') {
		var player = args.player;
		//console.log('Player: ' + player);
		if(player === turn) {
			if(player === 'X') {
				turn = 'O';
			} else {
				turn = 'X';
			}

			if(notify !== null) {
				var row = args.row;
				var col = args.col;
				var res = row + ',' + col;
				notify(res);
				notify = null;
			}

			content = String(true);
		} else {
			content = String(false);
		}
	} else if(path === 'whoseturn') {
		content = turn;
	} else if(path === 'awaitturn') {
		var player = args.player;
		notify = function(res) {
			response.end(res);
		}
		// Do not close the connection yet! 
		return;
	} else if(fs.existsSync(path)) {
		content = fs.readFileSync(path);
	}
	response.end(content);
}

var server = http.createServer(clientRequest);
server.listen(1192);