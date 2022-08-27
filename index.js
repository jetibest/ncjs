#!/usr/bin/env node

const net = require('net');

function dbg(msg)
{
	process.stderr.write(msg + '\n');
}
function die(err)
{
	if(err) dbg(err);
	process.exit(1);
}
function help()
{
	process.stderr.write([
		'Usage: ncjs [options] [host] <port>',
		'',
		'OPTIONS',
		'  -c, --close        Automatically close stdin when socket is closed by',
		'                     server. Warning: this option is automatically',
		'                     turned on if stdin is tty/pty.',
		'  -w, --wait <time>  Connect timeout in seconds (float allowed).',
		'  -v, --verbose      Set verbosity level (can be used several times).',
		'',
		'Note: Unlike nc/netcat, ncjs is only a socket client, and cannot listen.',
		'',
		''
	].join('\n'));
}

var opts = {
	// if terminal, then automatically close stdin when server ends the socket
	close: process.stdin.isTTY,
	
	// print verbose messages to stderr (0: nothing, 1: events, 2: maximum)
	verbose: 0,
	
	// set connect timeout
	connectTimeout: null
};

var args = process.argv.slice(2).filter(arg =>
{
	if(opts.connectTimeout === 0)
	{
		opts.connectTimeout = parseFloat(arg);
		if(!opts.connectTimeout)
		{
			die('error: Invalid timeout option value (' + JSON.stringify(arg) + ').');
		}
		return false;
	}
	else if(arg.startsWith('-'))
	{
		if(arg === '-h' || arg === '--help')
		{
			help();
			process.exit(0);
		}
		else if(arg === '-w' || arg === '--wait')
		{
			opts.connectTimeout = 0;
		}
		else if(arg === '-c' || arg === '--close')
		{
			opts.close = true;
		}
		else if(arg.startsWith('-v') || arg === '--verbose')
		{
			opts.verbose += arg.split('').filter(c => c === 'v').length;
		}
		return false;
	}
	return true;
});

var host = args[0] || '';
var port = args[1] || '';

var net_opts = {
	allowHalfOpen: true
};

net_opts.port = parseInt(port || host);
if(host && port) net_opts.host = host;

if(!net_opts.port)
{
	dbg('error: Missing argument (port). For correct usage, see below:\n');
	help();
	die();
}

if(opts.verbose > 1) dbg('opts: ' + JSON.stringify(opts));
if(opts.verbose > 1) dbg('net_opts: ' + JSON.stringify(net_opts));

function start(socket, opts)
{
	var stdin_ended = false;
	var socket_ended = false;
	var stdout_ended = false;

	process.stdin.on('data', chunk =>
	{
		if(opts.verbose > 1) dbg('stdin:data');
		
		if(!socket_ended) socket.write(chunk);
	});
	process.stdin.on('end', () =>
	{
		stdin_ended = true;
		
		if(opts.verbose > 0) dbg('stdin:end');
		
		if(!socket_ended) socket.end();
	});
	process.stdin.on('error', err =>
	{
		if(opts.verbose > 0) dbg('stdin:error');
		
		die('error(stdin): ' + err.code);
	});
	process.stdin.on('close', () =>
	{
		stdin_ended = true;
		
		if(opts.verbose > 0) dbg('stdin:close');
		
		if(!socket_ended) socket.end();
	});
	
	socket.on('data', chunk =>
	{
		if(opts.verbose > 1) dbg('socket:data');
		
		if(!stdout_ended) process.stdout.write(chunk);
	});
	socket.on('end', () =>
	{
		socket_ended = true;
		
		if(opts.verbose > 0) dbg('socket:end');
		
		if(!stdout_ended) process.stdout.end();
		
		if(!stdin_ended && opts.close) process.stdin.destroy();
	});
	socket.on('finish', () =>
	{
		if(opts.verbose > 0) dbg('socket:finish');
	});
	socket.on('error', err =>
	{
		if(opts.verbose > 0) dbg('socket:error');
		
		die('error(socket): ' + err.code);
	});
	socket.on('close', () =>
	{
		socket_ended = true;
		
		if(opts.verbose > 0) dbg('socket:close');
	});
	
	process.stdout.on('finish', () =>
	{
		if(opts.verbose > 0) dbg('stdout:finish');
	});
	process.stdout.on('error', err =>
	{
		if(opts.verbose > 0) dbg('stdout:error');
		
		die('error(stdout): ' + err.code);
	});
	process.stdout.on('close', () =>
	{
		stdout_ended = true;
		
		if(opts.verbose > 0) dbg('stdout:close');
	});
	
	process.stderr.on('error', err => process.exit(2));
}

var connect = err =>
{
	if(err)
	{
		if(!net_opts.family)
		{
			// check if we can retry with IPv4
			net_opts.family = 4;
			
			if(opts.verbose > 0) dbg('net:connect(): trying IPv4...');
		}
		else
		{
			// no other connection options available
			return die('error(net): ' + err.code);
		}
	}
	
	try
	{
		var socket = net.createConnection(net_opts);
		socket.on('connect', () =>
		{
			if(opts.verbose > 0) dbg('socket:connect');
			
			clearTimeout(connectTimer);
			
			socket.off('error', connect);
			
			start(socket, opts);
		});
		socket.on('error', connect);
		
	}
	catch(err)
	{
		die('error(net): ' + err.code);
	}
};

// apply connect timeout
var connectTimer;
if(opts.connectTimeout) connectTimer = setTimeout(() => die('error: Connection timeout (' + (net_opts.host || '') + ':' + net_opts.port + '). Failed to connect within ' + opts.connectTimeout + ' seconds.'), opts.connectTimeout * 1000);

connect();

