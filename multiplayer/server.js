var fs = require('fs');
var http = require('http');
var url = require('url');

var notify = null;
var gameState = '';
var player1 = null;
var player2 = null;
var count = 0;

function clear(){
	notify = null;
	gameState = '';
	player1 = null;
	player2 = null;
	count = 0;
}

function clientRequest(request, response) {
	var parsedUrl = url.parse(request.url, true);
	var path = parsedUrl.pathname.substring(1);
	var args = parsedUrl.query;

	if(path === '' || path === 'index.html') {
		path = 'index.html';
	}

	var content = '404: Not found';
	if(path === 'taketurn') {
		if(notify !== null) {
			gameState = args.newGameState;
			var res = args.row + ',' + args.col;
			notify(res);
			notify = null;
		}
		content = String(true);
	} else if(path === 'awaitturn') {
		notify = function(res) {
			response.end(res);
		}
		return;
	} else if(path === 'attemptenter'){
		if(count>=2){
			response.end('false');
		}
		else{
			count++;
		}
	} else if(path === 'enter') {
		if(player1==null) player1 = args;
		else if(player2==null) {
			player2 = args;
			if(player1.size != player2.size) response.end('false');
			else if((player1.p1=='remote' && player1.p2=='remote') || (player2.p1=='remote' && player2.p2=='remote'))
				response.end('false');
			else if((player1.p1=='remote' && player2.p1=='remote') || (player1.p2=='remote' && player2.p2=='remote'))
				response.end('false');
		}
	} else if(path === 'gamestate') {//checks if the user who's attempting to make a move is synced.
		var prevGameState = args.prevGameState;
		if((parseInt(prevGameState)==0 && gameState == '') || prevGameState == gameState)//synced. Game continues. 
			response.end(String(true));
		else response.end(String(false));//out of sync.
	} else if(path ==='clear') {
		clear();
		content = 'server cleared';
	} else if(fs.existsSync(path)) {
		content = fs.readFileSync(path);
	}
	response.end(content);
}

var server = http.createServer(clientRequest);
server.listen(1192);