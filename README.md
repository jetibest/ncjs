# ncjs
Easy-to-use socket client with half-open socket functionality.

This tool only implements the client side, and thus cannot act as a
server and listen to incoming connections.

Only the most basic options are implemented.

# Installation
```
git clone https://github.com/jetibest/ncjs && ncjs/install.sh
```

# Help
```
Usage: ncjs [options] [host] <port>

OPTIONS
  -c, --close        Automatically close stdin when socket is closed by
                     server. Warning: this option is automatically
                     turned on if stdin is tty/pty.
  -w, --wait <time>  Connect timeout in seconds (float allowed).
  -v, --verbose      Set verbosity level (can be used several times).

Note: Unlike nc/netcat, ncjs is only a socket client, and cannot listen.
```

# Why ncjs?

In contrast to nc/netcat, this simple tool allows you to write a command
to a server, intuitively ending stdin, while still keeping the socket
half-open to wait for a reply from the server. Example:

```
[s ~]$ echo bye | nc -l -p 3000
hello
[s ~]$ 

[c ~]$ echo hello | ncjs 127.0.0.1 3000
bye
[c ~]$ 
```

This does not work with GNU netcat, which either will hang:

```
[s ~]$ echo bye | nc -l -p 3000
hello

[c ~]$ echo hello | nc 127.0.0.1 3000
bye
```

Or when using the `--close` flag, will close way too soon:

```
[s ~]$ echo bye | nc -l -p 3000
[s ~]$ 

[c ~]$ echo hello | nc --close 127.0.0.1 3000
write(net): Broken pipe
[c ~]$ 
```

Furthermore, when using tty/pty, the `-c` flag is automatically
enabled in ncjs. If the server closes the socket - due to the
asymmetrical nature of the client/server interaction - this
usually means the client should or wants to disconnect as well.
The typical use-case being that the client requested to terminate
the connection by typing `quit` or `exit`, or some error occurred
on the server.
