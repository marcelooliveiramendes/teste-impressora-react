import React, { useState } from "react";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import { Button, TextField } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import aguia from "./assets/itfast.png";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    textAlign: "center",
  },
  imgBox: {
    maxWidth: "80%",
    maxHeight: "80%",
    margin: "10px",
  },
  img: {
    height: "inherit",
    maxWidth: "inherit",
  },
  input: {
    display: "none",
  },
}));

let printCharacteristic = null;
let deviceG = null;

function App() {
  const classes = useStyles();
  const [source, setSource] = useState("");
  const handleCapture = (target) => {
    if (target.files) {
      if (target.files.length !== 0) {
        const file = target.files[0];
        const newUrl = URL.createObjectURL(file);
        setSource(newUrl);
      }
    }
  };

  const [message, setMessage] = useState("");

  function print() {
	  if(deviceG == null){
    navigator.bluetooth
      .requestDevice({
        filters: [
          {
            name: "InnerPrinter",
          },
        ],
        optionalServices: ["00001101-0000-1000-8000-00805f9b34fb"], // Required to access service later.
      })
      .then((device) => {
        if (device.gatt.connected) {
          device.gatt.disconnect();
        }
		deviceG = device;
        return connect(deviceG);
      })
      .catch(handleError);
	  } else {
		  return connect(deviceG);
	  }
  }
  function connect(device) {
    return device.gatt
      .connect()
      .then((server) => {
        server
          .getPrimaryService("00001101-0000-1000-8000-00805f9b34fb")
          .then((service) => {
            service
              .getCharacteristic("00001101-0000-1000-8000-00805f9b34fb")
              .then((characteristic) => {
                printCharacteristic = characteristic;
                sendTextData(device);
              });
          });
      })
      .catch((error) => {
        handleError(error, device);
      });
  }
  function handleError(error, device) {
    console.error("handleError => error", error);
    if (device != null) {
      device.gatt.disconnect();
    }
    let erro = JSON.stringify({
      code: error.code,
      message: error.message,
      name: error.name,
    });
    console.log("handleError => erro", erro);
    if (error.code !== 8) {
      console.log("Não foi possivel abrir conexão com a impressora");
    }
  }
  function getBytes(text) {
    let br = "\u000A\u000D";
    text = text === undefined ? br : text;
    let replaced = text; //this.$languages.replace(text);
    let bytes = new TextEncoder("utf-8").encode(replaced + br);
    return bytes;
  }
  function addText(arrayText) {
    let text = message;
    arrayText.push(text);
    while (text.length >= 20) {
      let text2 = text.substring(20);
      arrayText.push(text2);
      text = text2;
    }
  }
  function sendTextData(device) {
    let arrayText = [];
    addText(arrayText);
    console.log("sendTextData => arrayText", arrayText);
    loop(0, arrayText, device);
	
  }
  function loop(i, arrayText, device) {
    let arrayBytes = getBytes(arrayText[i]);
    write(device, arrayBytes, () => {
      i++;
      if (i < arrayText.length) {
        loop(i, arrayText, device);
      } else {
        let arrayBytes = getBytes();
        write(device, arrayBytes, () => {
          device.gatt.disconnect();
        });
      }
    });
  }
  function write(device, array, callback) {
    printCharacteristic
      .writeValue(array)
      .then(() => {
        setTimeout(() => {
          if (callback) {
            callback();
          }
        }, 250);
      })
      .catch((error) => {
		device.gatt.disconnect();
		if(!device.gatt.connected){
		  connect(device).then();
	    }
      });
  }

  return (
    <div className={classes.root}>
      <Grid
        container
        style={{
          display: "flex",
          flexDirection: "column",
          margin: "auto",
          justifyContent: "center",
        }}
      >
        <Grid item>
          <img
            src={aguia}
            alt="Aguia"
            style={{ width: "80%", height: "100%" }}
          />
        </Grid>
        <Grid item>
          <p
            style={{ color: "blue" }}
            onClick={() => window.open("https://www.itfast.com.br", "_blank")}
          >
            www.itfast.com.br
          </p>
        </Grid>
      </Grid>
      <Grid container style={{ marginTop: 50 }} spacing={3}>
        <Grid
          container
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Grid item>
            <TextField
              id="txtEntrada"
              type=""
              inputProps={{
                name: "txtEntrada",
                label: "Texto impressão",
                // onChange: { handleChange },
              }}
              onChange={(event) => setMessage(event.target.value)}
            />
          </Grid>
          <Grid item style={{ marginTop: 20 }}>
            <Button variant="contained" color="primary" onClick={print}>
              Imprimir
            </Button>
          </Grid>
        </Grid>
        <Grid item xs={12} style={{ marginTop: 30 }}>
          <input
            accept="image/*"
            className={classes.input}
            id="icon-button-file"
            type="file"
            capture="environment"
            onChange={(e) => handleCapture(e.target)}
          />
          <label htmlFor="icon-button-file">
            <Button variant="contained" color="primary" component="span">
              Abrir Câmera
            </Button>
          </label>
          <h5>Imagem Camera</h5>
          {source && (
            <Box
              style={{
                margin: "auto",
              }}
              border={1}
              className={classes.imgBox}
            >
              <img src={source} alt={"snap"} className={classes.img}></img>
            </Box>
          )}
        </Grid>
      </Grid>
    </div>
  );
}
export default App;