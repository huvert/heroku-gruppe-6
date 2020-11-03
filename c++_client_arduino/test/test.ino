#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly

#include <WiFi.h>//Imports the needed WiFi libraries
#include <WiFiMulti.h> //We need a second one for the ESP32 (these are included when you have the ESP32 libraries)

#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets

#define SERVER_IP "192.168.1.12"
#define SERVER_PORT 4000

const char* SSID = "a";
const char* PASSWORD = "password";

WiFiMulti WiFiMulti;            //Declare an instane of the WiFiMulti library
SocketIoClient webSocket;       //Decalre an instance of the Socket.io library


//    Use this function on text you want to send to server.
//    ex: String "Hello World" --> char[arr_size] ""Hello World"" 

void textWrapper(char* outerArr, String text, int arr_size) {
  text = "\""+text+"\"";     // returns: "text"
  char cnt[arr_size];
  text.toCharArray(cnt, arr_size);
  for(int i=0; i < arr_size; ++i){
    outerArr[i] = cnt[i];
  }
}


void testevent(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload);
  char str[10];                   //Decalre a char array (needs to be char array to send to server)
  itoa(analogRead(27), str, 10);  //Use a special formatting function to get the char array as we want to, here we put the analogRead value from port 27 into the str variable
  webSocket.emit("data->server", str);            // TEST SEND DATA TO SERVER
}

void dataRequest(const char * DataRequestData, size_t length) {//This is the function that is called everytime the server asks for data from the ESP32

  Serial.printf("Datarequest Data: %s\n", DataRequestData);
  Serial.println(DataRequestData);

  //Data conversion
  String dataString(DataRequestData);
  int RequestState = dataString.toInt();

  Serial.print("This is the Datarequest Data in INT: ");
  Serial.println(RequestState);

  if(RequestState == 0) {           //If the datarequest gives the variable 0, do this (default)
    char str[10];                   //Decalre a char array (needs to be char array to send to server)
    itoa(analogRead(27), str, 10);  //Use a special formatting function to get the char array as we want to, here we put the analogRead value from port 27 into the str variable
    Serial.print("ITOA TEST: ");
    Serial.println(str);

    // Ville trasha koden ovenfor å erstattet den med noe lignende:
    // data = readSensor();
    // data = processData(data);
    // elns

    // Må velge hvilket format dataen skal sendes i.
    // ex: source#data#unit      -->   levelsensor#4000#Pa
    // Dataen behandles i server men lagres i firebase.
    // Kan endre navn på identifier men oppdater dette i COMMUNICATION.txt
    webSocket.emit("data->server", str); //Here the data is sendt to the server and then the server sends it to the webpage
    //Str indicates the data that is sendt every timeintervall, you can change this to "250" and se 250 be graphed on the webpage
  }
}


void setup() {
    /* Basic arduino setup*/
    Serial.begin(9600);
    Serial.setDebugOutput(true);  //Set debug to true (during ESP32 booting)
    Serial.println();
    Serial.println();
    Serial.println();
    for(uint8_t t = 4; t > 0; t--) { //More debugging
        Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
        Serial.flush();
        delay(1000);
    }

    // Wifi setup
    WiFiMulti.addAP(SSID, PASSWORD);
    Serial.println("Connecting to wifi");
    while(WiFiMulti.run() != WL_CONNECTED) {
      Serial.println(".");
      delay(100);
    }
    Serial.println("Connected to WiFi successfully!"); //When we have connected to a WiFi hotspot

    // Websocket Setup
    webSocket.on("chat-message", testevent);      //ex: socket.emit("identifier", data)

    //Send data to server/webpage
    webSocket.on("dataRequest", dataRequest); //Listens for the command to send data

    webSocket.begin(SERVER_IP, SERVER_PORT);  //This starts the connection to the server with the ip-address/domainname and a port (unencrypted)

    
    // When sending strings via webSocket.emit():
    //  1. create a String
    //  2. create a char array
    //  3. run function textWrapper. (see below)
    String esp = "esp";
    char room[10];                    // socketIo library seems wants data in this format...
    textWrapper(room, esp, 10);
    Serial.print(room);
    webSocket.emit("join-room", room);       // This lets the server know the client is type: esp
}


void loop() {
  webSocket.loop(); //Keeps the WebSocket connection running
  //DO NOT USE DELAY HERE, IT WILL INTERFER WITH WEBSOCKET OPERATIONS
  //TO MAKE TIMED EVENTS HERE USE THE millis() FUNCTION OR PUT TIMERS ON THE SERVER IN JAVASCRIPT
}
