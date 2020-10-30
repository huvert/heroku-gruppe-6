



#ifndef QUICKSOCKET_H
#define QUICKSOCKET_H
#include <SocketIoClient.h>       // This also includes websockets.

class QuickSocket : public SocketIoClient
{
public:
    void init(const char* host, const int port);

};

void event(const char * payload, size_t length);  // This is a example / test function

#endif
