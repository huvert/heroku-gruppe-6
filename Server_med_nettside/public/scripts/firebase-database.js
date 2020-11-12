function writeEspData(readId, readData) {
    firebase.database().ref('ESP32-Data/' + readId).set({
        readData: readData,

    //Todo: Get and write timestamp
    });
}
