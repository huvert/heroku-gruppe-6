function writeEspData(readId, readData) {
    firebase.database().ref('ESP32-Data/' + readId).set({
        readData: readData,

    //Todo: Get and write timestamp
    });
}

/*Todo:
 Read function
 Read and increment function
 function to read from ESP
 */