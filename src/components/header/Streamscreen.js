import React, { useEffect, useState } from 'react'
import "./Streamscreen.css"
import IVSBroadcastClient, {
  Errors,
  BASIC_LANDSCAPE,
  AddVideoInputDeviceCommand
} from 'amazon-ivs-web-broadcast';

import { IvsClient, GetStreamCommand } from "@aws-sdk/client-ivs"; // ES Modules import


export default function Header() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [streamStart, setStreamStart] = useState(false)

  const config = {
    region: process.env.REACT_APP_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_SECRET_KEY_ID,
      Region: process.env.REACT_APP_REGION
    }
  };

  const client = IVSBroadcastClient.create({
    // Enter the desired stream configuration
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    // Enter the ingest endpoint from the AWS console or CreateChannel API
    ingestEndpoint: process.env.REACT_APP_INGEST_ENDPOINT,
  });


  useEffect(() => {


    const handlePermissions = async () => {
      let permissions = {
        audio: false,
        video: false,
      };
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        for (const track of stream.getTracks()) {
          track.stop();
        }
        permissions = { video: true, audio: true };
        /////Set Up a Stream Preview
        const previewEl = document.getElementById('preview');
        client.attachPreview(previewEl);

        //////List Available Devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        window.videoDevices = devices.filter((d) => d.kind === 'videoinput');
        window.audioDevices = devices.filter((d) => d.kind === 'audioinput');


        ////Retrieve a MediaStream from a Device
        const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE;
        window.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: window.videoDevices[0].deviceId,
            width: {
              ideal: streamConfig.maxResolution.width,
              max: streamConfig.maxResolution.width,
            },
            height: {
              ideal: streamConfig.maxResolution.height,
              max: streamConfig.maxResolution.height,
            },
          },
        });
        window.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: window.audioDevices[0].deviceId },
        });


        /////Add Device to a Stream
        client.addVideoInputDevice(window.cameraStream, 'video2', { index: 0 }); // only 'index' is required for the position parameter
        client.addAudioInputDevice(window.microphoneStream, 'audio2');

      } catch (err) {
        permissions = { video: false, audio: false };
        console.error(err.message);
      }

      // If we still don't have permissions after requesting them, display the error message
      if (!permissions.video) {
        console.error('Failed to get video permissions.');
      } else if (!permissions.audio) {
        console.error('Failed to get audio permissions.');
      }
    };

    handlePermissions();
  }, [client]);

  const startbrodcast = () => {
    client
      .startBroadcast(process.env.REACT_APP_STREAM_KEY)
      .then((result) => {
        console.log("brodcast started successfully");
      })
      .catch((error) => {
        console.error('Something drastically failed while broadcasting!', error);
      });


  }

  const stopbrodcast = () => {
    client.stopBroadcast(process.env.REACT_APP_STREAM_KEY)
  }

  const toggleAudio = () => {
    setAudioEnabled((prev) => !prev);
    const audioStream = client.getAudioInputDevice('audio2');
    audioStream.getAudioTracks()[0].enabled = !audioEnabled;
  };

  const toggleVideo = () => {
    setVideoEnabled((prev) => !prev);
    const videoStream = client.getVideoInputDevice('video2').source;
    videoStream.getVideoTracks()[0].enabled = !videoEnabled;
  };
  let stream1;
  const handelscreenshare = async () => {
    if (navigator.mediaDevices.getDisplayMedia) {
      stream1 = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: {
          cursor: "always"
        }
      })

      client.removeAudioInputDevice('audio2');
      client.removeVideoInputDevice('video2');
      client.addVideoInputDevice(window.cameraStream, 'video2', { index: 5, width: 300, x: -900, y: 0 }); // only 'index' is required for the position parameter
      client.addVideoInputDevice(stream1, 'video3', { index: 6, width: 1200, x: -175, y: 0 })


      console.log("stream=>>>>.", stream1);
      stream1.addEventListener('inactive', handleStopShare)
    }
  }

  const stopshare = () => {
    if (stream1) {
      stream1.getTracks().forEach((track) => track.stop());
      console.log("hello screen shreaing is");
    }
  }


  const handleStopShare = () => {
    // Call your function here when screen sharing stops
    // console.log('Screen sharing stopped');
    client.addVideoInputDevice(window.cameraStream, 'video4', { index: 3 }); // only 'index' is required for the position parameter

    const previewEl = document.getElementById('preview');
    client.attachPreview(previewEl);

    // Remove event listener to prevent multiple calls
    stream1.removeEventListener('inactive', handleStopShare);
  };

  ////click on stream button when we your stream is live ie. after start brodcasting
  const stream = async () => {
    const streamData = new IvsClient(config);
    const input = { // GetStreamRequest
      channelArn: process.env.REACT_APP_CHANNEL_ARN, // required
    };
    const command = new GetStreamCommand(input);
    try {
      const response = await streamData.send(command);
      console.log(response);
      await setStreamStart(true);
      console.log("streamStart=>>>>>>>>>", streamStart);

    } catch (error) {
      console.log(error);
      setStreamStart(false)
    }
  }


  return (
    <>
      <div className='container'>
        <h2 className='main_heading text-center'>Brodcast to Ivs</h2>
      </div>
      <div>
        <canvas id="preview">

        </canvas>
      </div>
      <div className='container'>
        <div className='row'>
          <div className='col-xl-3'></div>
          <div className='col-xl-6'>
            <button onClick={startbrodcast}>start brodcast</button>
            <button onClick={stopbrodcast}>stop brodcast</button>
            <button onClick={toggleAudio}>{audioEnabled ? 'Mute' : 'Unmute'}</button>
            <button onClick={toggleVideo}>{videoEnabled ? 'Hide' : 'Show'}</button>
            <button onClick={handelscreenshare}>share screen</button>
            <button onClick={stopshare}>stop share</button>
            <button onClick={stream}>stream</button>

          </div>
          <div className='col-xl-3'></div>
        </div>
      </div>
    </>
  )
}
