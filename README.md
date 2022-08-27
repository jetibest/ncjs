# ncjs
Easy-to-use socket client with half-open socket functionality.

In contrast to nc/netcat, this simple tool allows you to write a command
to a server, intuitively ending stdin, while still keeping the socket
half-open to wait for a reply from the server.

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
