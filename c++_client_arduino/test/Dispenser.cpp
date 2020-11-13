#include "Dispenser.h"

SocketIoClient dispenserWebSocket;       //Decalre an instance of the Socket.io library. 


// "funksjon" som heter det samme som class. dette er en constructor. er for å sette variabler når man kaller opp classen i programmet.
Dispenser::Dispenser(float sonicMIN, float sonicMAX)
{
  int var = 0;    // switch case variabel
  unsigned long previousTime = 0;
  int pressCount = 0;
  unsigned long previousSonicTime = 0;
  setParameters(sonicMIN, sonicMAX);
}


// setter parameterene fra oppkalling av class.
void Dispenser::setParameters(float sonicMIN, float sonicMAX)
{
  sonicMin = sonicMIN;
  sonicMax = sonicMAX;
}

void Dispenser::init()
{
  Myservo.attach(DISP_SERVOPIN);
  pinMode(DISP_ECHOPIN, INPUT);
  pinMode(DISP_TRIGPIN , OUTPUT);
  pinMode(DISP_FSRPIN, INPUT);
  Myservo.write(0);
}


/* funksjon som syr sammen funksjonen for dispenseren.
  ved hjelp av en switch case. note: alle IF statmentsene er dratt ut til 2 istedet for 1 felles pga trøbbel med ESP32 */
void Dispenser::dispenserProgram()
{
  switch (var) {
    // 0: start funksjon som leser av US verdier og venter på at noe skal komme inngenfor range
    case 0:
      sonicListen();
      if (sonicCm <= sonicMax && sonicCm >= sonicMin) {
        var = 1;
        previousTime = millis();
      }
      break;

    // 1: setter servoren til 90 og venter x-sek før den oppdaterer previousTime og hopper til enste steg
    case 1:
      Myservo.write(90);
      if (millis() - previousTime >= 2000) {
        var = 2;
        previousTime = millis();
      }
      break;

    // 2: setter servoren til 0 og venter x-sek før den oppdaterer previousTime og hopper til enste steg
    case 2:
      Myservo.write(0);
      if (millis() - previousTime >= 2000) {
        var = 3;
        previousTime = millis();
      }
      break;

    // 3: holder seg innenfor dette steget hvis armen fortsatt er innfor range. hvis ikke hopper den til neste.
    case 3:
      sonicListen();
      if (sonicCm <= sonicMin || sonicCm >= sonicMax) {
        var = 4;
      }
      else {
        var = 3;
      }
      break;

    // 4: avsluttnignsteg som oppdaterer presscound og leser av nåværende verdier
    // og sender de til server før den hopper tilbake til startsteget
    case 4:
      pressCount ++;
      sendValues();
      var = 0;
      break;

    // defalut steg som sier at den skal hoppe tilabke til start steget om den kommer utenfor.
    // dette vil ikke kunne skje så fjernes nok :)
    default:
      var = 0;
      break;
  }
}

// wrapper inn en verdiene fra en string og skriver det til en char-array som server kan motta
// sender verdier fra esp til server. akuratt nå sendes de bare til serial montior men det fungerer inntil videre ;)
void Dispenser::sendValues() {
  textWrapper(outerArr, updateSensorValues());
  dispenserWebSocket.emit(outerArr);
}


// sender en puls ved trig pin ut ifra satt interval. ser på tiden det tar mellom puls ut og inn og regner om tiden til avstand i cm
float Dispenser::sonicListen()
{
  if (millis() - previousSonicTime >= DISP_SONIC_INTERVAL) {
    trigPinState = ! trigPinState;
    digitalWrite(DISP_TRIGPIN, trigPinState);
    previousSonicTime = millis();

    if (trigPinState == false) {
      float echoTime = pulseIn(DISP_ECHOPIN, HIGH);
      sonicCm = (echoTime / 2) / 29.1;
    }
  }
  return sonicCm;
}


// leser av og returnerer nivået i flaska som en prosentverdi
float Dispenser::readFsr()
{
  bottleLevel = analogRead(DISP_FSRPIN);
  bottleLevel = map(bottleLevel, DISP_FSRMIN, DISP_FSRMAX, 0, 100); //mapper om signal fra FSR til prosent
  return bottleLevel;
}



//leser av sensorverdier og skriver de til en string. format: "level#data#count"
String Dispenser::updateSensorValues()
{
  frsValue = readFsr();
  FrsValueStr = String(frsValue, 1);
  sensorString = String("Level#" + FrsValueStr + "#Presscount#" + pressCount + "#");
  return sensorString;
}


// tar en string og wrapper den inn i en "..." og skriver den om til en char array istedet. 
void Dispenser::textWrapper(char* outerArr, String text) {
  text = "\"" + text + "\""; // returns: "text"
  char cnt[DISP_ARRAYLENGTH];
  text.toCharArray(cnt, DISP_ARRAYLENGTH);
  for (int i = 0; i < DISP_ARRAYLENGTH; ++i) {
    outerArr[i] = cnt[i];
  }
}
