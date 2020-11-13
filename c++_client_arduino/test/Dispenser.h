#ifndef DISPENSER_H
#define DISPENSER_H

#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets
#include <ESP32Servo.h> //importerer bibliotek servomotor
#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly

#define DISP_ECHOPIN 5
#define DISP_TRIGPIN 4
#define DISP_FSRPIN 33 //trykksensor
#define DISP_SERVOPIN 2 //servoMotor 
#define DISP_SONIC_INTERVAL 5 // tiden (i ms) mellom hver avlesning på sonic sensor
#define DISP_ARRAYLENGTH 40
#define DISP_FSRMIN 0
#define DISP_FSRMAX 679

class Dispenser
{

  public:
    //------- variabler -------
    char outerArr[DISP_ARRAYLENGTH];

    //------- funksjoner -------
    Servo Myservo;
    Dispenser(float sonicMIN, float sonicMAX);
    void init();
    void dispenserProgram();
    void setParameters(float sonicMIN, float sonicMAX);
    void sendValues();
    void textWrapper(char* outerArr, String text);

  private:

    int var;    // switch case variabel
    unsigned long previousTime;
    int pressCount;
    String sensorString;
    // variabler tilhørende ultrasonic-sensor
    float sonicMin;
    float sonicMax;
    bool trigPinState;
    int long duration;
    int distance;
    unsigned long previousSonicTime;
    int long cm;
    float sonicCm;
    // variabler tilhørende FSR-sensor
    String FrsValueStr;
    float frsValue;
    float bottleLevel;

    //------- funksjoner -------
    float sonicListen();
    float readFsr();
    String updateSensorValues();
};

#endif
