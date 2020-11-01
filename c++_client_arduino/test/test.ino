// #include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly
#include "QuickSocket.h"
#include <WiFi.h>//Imports the needed WiFi libraries

#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets

QuickSocket webSocket; //Decalre an instance of the Socket.io library

/*
void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload);
}
*/
const char* SSID = "a";
const char* passwd = "password";


void setup() {
  /* Basic arduino setup*/
  Serial.begin(9600);
  Serial.setDebugOutput(true);                  //Set debug to true (during ESP32 booting)
  for(uint8_t t = 4; t > 0; t--) {              //More debugging
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  /*  Wifi Setup */
  WiFi.begin(SSID, passwd);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nConnected to the WiFi network");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  /* Websocket setup
     ex: webSocket.on("identifier", function) */

  webSocket.init("192.168.1.12", 4000);
}


void loop() {
  webSocket.loop(); //Keeps the WebSocket connection running
  //DO NOT USE DELAY HERE, IT WILL INTERFER WITH WEBSOCKET OPERATIONS
  //TO MAKE TIMED EVENTS HERE USE THE millis() FUNCTION OR PUT TIMERS ON THE SERVER IN JAVASCRIPT
}
