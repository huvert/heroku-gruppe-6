
#include "QuickSocket.h"


void QuickSocket::init(const char* host, const int port)
{
    // Add all events here (Built in)
    // Note that you will still be able to add more events outside of this library if needed (??).
    QuickSocket::on("chat message", event);
    QuickSocket::begin(host, port);      //This starts the connection to the server with the ip-address/domainname and a port (unencrypted)
}



void event(const char * payload, size_t length) //Default event, what happens when you connect
{
    Serial.printf("got message: %s\n", payload);
}
