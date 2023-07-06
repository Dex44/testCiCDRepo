import { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";
import { WhiteboardContext } from "./WhiteboardContext";
import WhiteboardCanvas from "./components/whiteboard/WhiteboardCanvas";
import WhiteboardToolkit from "./components/whiteboard/WhiteboardToolkit";
// import Header from './components/header/Header';
import Streamscreen from "./components/header/Streamscreen";
import Playerscreen from "./components/player/Playerscreen";
import { IvsClient, GetStreamCommand } from "@aws-sdk/client-ivs"; // ES Modules import
import Chat from "./components/chat_temp/chat";
import { ChatRoom } from "amazon-ivs-chat-messaging";
import axios from "axios";
import ChatBox from "./components/chat";

function App() {
  const [streamStart, setStreamStart] = useState(false);
  const [chatRoom, setChatRoom] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [token, setToken] = useState([]);

  const config = {
    region: process.env.REACT_APP_REGION,
    credentials: {
      accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_SECRET_KEY_ID,
      Region: process.env.REACT_APP_REGION,
    },
  };

  const tokenProvider = async (selectedUsername, isModerator) => {
    // const uuid = "12334";
    console.log("TOKWEN PROVIDER");
    const permissions = isModerator
      ? ["SEND_MESSAGE", "DELETE_MESSAGE", "DISCONNECT_USER"]
      : ["SEND_MESSAGE"];

    const data = {
      roomIdentifier:
        "arn:aws:ivschat:ap-south-1:625434405715:room/gqSnwq8BSdIq",
      userId: `${selectedUsername}.${Math.random()}`,
      attributes: {
        username: `${selectedUsername}`,
        // avatar: `${avatarUrl.src}`,
      },
      sessionDurationInMinutes: 60,
      capabilities: permissions,
    };

    var token;
    try {
      const response = await axios.post(
        `http://localhost:3003/create_chat_token`,
        data
      );
      token = {
        token: response.data.token,
        sessionExpirationTime: new Date(response.data.sessionExpirationTime),
        tokenExpirationTime: new Date(response.data.tokenExpirationTime),
      };
      setToken(token);
    } catch (error) {
      console.error("Error:", error);
    }

    return token;
  };

  const connectRoom = () => {
    try {
      const room = new ChatRoom({
        regionOrUrl: "ap-south-1",
        tokenProvider: () =>
          tokenProvider(
            "User_V1",
            ["SEND_MESSAGE", "DELETE_MESSAGE", "DISCONNECT_USER"],
            "avatarUrl"
          ),
      });
      console.log("room");
      setChatRoom(room);
      console.log("rppm", chatRoom);
      console.log("rppm", chatRoom.state);

      // Connect to the chat room
      room.connect();
    } catch (error) {
      console.log("Error -->", error);
    }
  };

  useEffect(() => {
    const stream = async () => {
      const streamData = new IvsClient(config);
      const input = {
        // GetStreamRequest
        channelArn: process.env.REACT_APP_CHANNEL_ARN, // required
      };
      const command = new GetStreamCommand(input);
      try {
        const response = await streamData.send(command);
        console.log(response);
        setStreamStart(true);
        console.log("streamStart=>>>>>>>>>", streamStart);
      } catch (error) {
        console.log(error);
        setStreamStart(false);
      }
    };
    stream();
  }, []);

  useEffect(() => {
    console.log("chatRoom useEffect", chatRoom);
    if (chatRoom.addListener) {
      chatRoom.addListener("connect", () => {
        // Connected to the chat room.
        setShowChat(true);
      });
    }
  });

  const renderChat = useCallback(() => {
    if (showChat) {
      // return <Chat token={token} chatRoom_v1={chatRoom}/>;
      return <ChatBox token={token} chatRoom_v1={chatRoom} />;
    }
  }, [showChat]);

  return (
    <div className="container">
      <button
        type="button"
        onClick={() => setStreamStart(!streamStart)}
        class="btn btn-default"
      >
        button
      </button>
      <button type="button" className="btn btn-primary" onClick={connectRoom}>
        Join Chat
      </button>

      {streamStart ? <Playerscreen /> : <Streamscreen />}
      {renderChat()}
      {/* <Chat /> */}
    </div>
  );
}

export default App;
