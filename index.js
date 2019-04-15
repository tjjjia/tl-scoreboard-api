const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

const ip = require('ip');
require('log-timestamp'); // timestamps in terminal/console (optional)

const ignore = [
	'/favicon.ico',
	'/apple-touch-icon-precomposed.png',
	'/apple-touch-icon.png'
]

const dependencies = [
	'/node_modules/lodash/lodash.min.js',
]

let data = new Object(); // init data object

/*
Serve scoreboard
*/
// catch '/' to serve scoreboard
app.get( '/', function( req, res ) {
	// serves scoreboard
	res.sendFile( __dirname + '/index.html' );

});

// serve dependencies (assets, for example js, css, or jpg)
for (var i = 0; i < dependencies.length; i++) {
	app.get( dependencies[i], function( req, res ) {
		console.log( `${req.url} requested by ${req.headers['user-agent']} @ ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}` );
		res.sendFile( __dirname + req.url );

	});
}


app.get( '/', function( req, res ) {
	// serves scoreboard
	res.sendFile( __dirname + '/index.html' );

});

// catch '/json' to serve json formatted scoreboard
app.get( '/json', function( req, res ) {
	// serves scoreboard
	console.log( `${req.url} requested by ${req.headers['user-agent']} @ ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}` );
	res.send( data );

});

// catch 'favicon.ico' request and send a 204 No Content status
for (var i = 0; i < ignore.length; i++) {
	app.get( ignore[i], (req, res) => res.sendStatus(204) );
	app.get( '/**'+ignore[i], (req, res) => res.sendStatus(204) );

}

// catch '*' to register queries
// because these lines of code come after '/', index.html gets served first
app.get('*', function(req, res) {
	let query = req.url, // return example: '/queryA/queryB'
		queries = query.split('/').filter(n => n); // splits at '/', adds to array and removes (filters) empty vars

	console.log( `${req.url} requested by ${req.headers['user-agent']} @ ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}` );

	res.send( queries );

	for (var i = 0; i < queries.length; i++) { // run through array
		if ( queries[i] in data ){ // check if key already exists in data object
			data[queries[i]]++; // exists, add to counter
			console.log(`Key '${queries[i]}' exists, updating…`);
		} else {
			data[queries[i]] = 1; // doesn't exits yet, make 1
			console.log(`New key '${queries[i]}' requested, creating…`);
		}
	}

	console.log( `Registered ${queries}` );
	console.log( 'The current score:', data );

	update_emit();

});


http.listen( port, function() {
	console.log( `Listening on http://${ip.address()}:${port}` );

});


/*
Use socket.io to log connected users
	push data on 'connection' event
*/
var connectedUsers = 0;

io.on( 'connection', function( socket ) {
	update_emit();

	connectedUsers++;
	console.log( `User connected:\t${connectedUsers} users connected` );

	socket.on( 'disconnect', function() {
		connectedUsers--;
		console.log( `User disconnected:\t${connectedUsers} users connected` );

	});

});

/*
Emit data together with 'scoreChanged' event.
	called with app.get('*') function
	called after client connects
*/
function update_emit() {
	io.emit('dataUpdate', data );

}
