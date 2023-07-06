import React, { createRef, useEffect, useRef, useState } from "react";
import "./chat.css";
import { FiSend } from "react-icons/fi";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { LiaSmileSolid } from "react-icons/lia";
import {
  DeleteMessageRequest,
  DisconnectUserRequest,
  SendMessageRequest,
} from "amazon-ivs-chat-messaging";
import axios from "axios";

const Chat = ({ token, chatRoom_v1 }) => {
  console.log("token", token);
  console.log("chatRoom_v1", chatRoom_v1);
  const [showSignIn, setShowSignIn] = useState(true);
  const [username, setUsername] = useState("");
  const [moderator, setModerator] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatRoom, setChatRoom] = useState([]);
  const [chatConnected, setChatConnected] = useState(false);
  //   const [showRaiseHandPopup, setShowRaiseHandPopup] = useState(false);
  const [usernameRaisedHand, setUsernameRaisedHand] = useState(null);
  const [handRaised, setHandRaised] = useState(false);
  const previousRaiseHandUsername = useRef(null);

  const chatRef = createRef();
  const messagesEndRef = createRef();

  const [formData, setFormData] = useState({
    userName: "",
    timeStamp: `${new Date().getHours()}:${new Date().getMinutes()}`,
    msg: "",
  });

  const [sentMsg, setSentMsg] = useState([]);

  const inputHandler = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    console.log(formData);
  };

  const formHandler = (e) => {
    e.preventDefault();
    if (formData.msg) {
      setSentMsg([...sentMsg, formData]);
      resetState();
    }
  };

  const resetState = () => {
    setFormData({
      userName: "User",
      timeStamp: `${new Date().getHours()}:${new Date().getMinutes()}`,
      msg: "",
    });
  };

  //#region
  // New Code
  useEffect(() => {
    previousRaiseHandUsername.current = usernameRaisedHand;
  }, [usernameRaisedHand]);

  useEffect(() => {
    if (chatRoom_v1.addListener) {
      chatRoom_v1.addListener("message", (message) => {
        console.log("message", message);
        setSentMsg([
          ...sentMsg,
          {
            ...formData,
            username: message?.sender?.userId,
            msg: message?.content,
          },
        ]);
      });
    }
  });

  // Handlers
  const handleError = (data) => {
    const username = "";
    const userId = "";
    const avatar = "";
    const message = `Error ${data.errorCode}: ${data.errorMessage}`;
    const messageId = "";
    const timestamp = `${Date.now()}`;

    const newMessage = {
      type: "ERROR",
      timestamp,
      username,
      userId,
      avatar,
      message,
      messageId,
    };

    setMessages((prevState) => {
      return [...prevState, newMessage];
    });
  };

  const handleMessage = (data) => {
    const username = data?.sender?.attributes?.username;
    const userId = data?.sender?.userId;
    const avatar = data?.sender?.attributes?.avatar;
    const message = data?.content;
    const messageId = data?.id;
    const timestamp = data?.sendTime;

    const newMessage = {
      type: "MESSAGE",
      timestamp,
      username,
      userId,
      avatar,
      message,
      messageId,
    };

    setMessages((prevState) => {
      return [...prevState, newMessage];
    });
  };

  const handleEvent = (event) => {
    const eventName = event.eventName;
    switch (eventName) {
      case "aws:DELETE_MESSAGE":
        // Ignore system delete message events, as they are handled
        // by the messageDelete listener on the room.
        break;
      case "app:DELETE_BY_USER":
        const userIdToDelete = event.attributes.userId;
        setMessages((prevState) => {
          // Remove message that matches the MessageID to delete
          const newState = prevState.filter(
            (item) => item.userId !== userIdToDelete
          );
          return newState;
        });
        break;
      default:
        console.info("Unhandled event received:", event);
    }
  };

  const handleOnClick = () => {
    setShowSignIn(true);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    // if (e.key === "Enter") {
    if (formData.msg) {
      sendMessage(formData.msg);
      // setSentMsg([...sentMsg, {...formData}]);
      // setMessage("");
      resetState();
    }
    // }
  };

  const deleteMessageByUserId = async (userId) => {
    // Send a delete event
    try {
      const response = await sendEvent({
        eventName: "app:DELETE_BY_USER",
        eventAttributes: {
          userId: userId,
        },
      });
      return response;
    } catch (error) {
      return error;
    }
  };

  const handleMessageDelete = async (messageId) => {
    const request = new DeleteMessageRequest(messageId, "Reason for deletion");
    try {
      await chatRoom.deleteMessage(request);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserKick = async (userId) => {
    const request = new DisconnectUserRequest(userId, "Kicked by moderator");
    try {
      await chatRoom.disconnectUser(request);
      await deleteMessageByUserId(userId);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSticker = (data) => {
    const username = data.sender.attributes?.username;
    const userId = data.sender.userId;
    const avatar = data.sender.attributes.avatar;
    const message = data.content;
    const sticker = data.attributes.sticker_src;
    const messageId = data.id;
    const timestamp = data.sendTime;

    const newMessage = {
      type: "STICKER",
      timestamp,
      username,
      userId,
      avatar,
      message,
      messageId,
      sticker,
    };

    setMessages((prevState) => {
      return [...prevState, newMessage];
    });
  };

  //   const handleRaiseHand = async (data) => {
  //     const username = data.sender.attributes?.username;
  //     setUsernameRaisedHand(username);

  //     if (previousRaiseHandUsername.current !== username) {
  //       setShowRaiseHandPopup(true);
  //     } else {
  //       setShowRaiseHandPopup((showRaiseHandPopup) => !showRaiseHandPopup);
  //     }
  //   };

  //   const handleStickerSend = async (sticker) => {
  //     const content = `Sticker: ${sticker.name}`;
  //     const attributes = {
  //       message_type: 'STICKER',
  //       sticker_src: `${sticker.src}`,
  //     };
  //     const request = new SendMessageRequest(content, attributes);
  //     try {
  //       await chatRoom.sendMessage(request);
  //     } catch (error) {
  //       handleError(error);
  //     }
  //   };

  //   const handleRaiseHandSend = async () => {
  //     const attributes = {
  //       message_type: 'RAISE_HAND',
  //     };

  //     const request = new SendMessageRequest(`[raise hand event]`, attributes);
  //     try {
  //       await chatRoom.sendMessage(request);
  //       setHandRaised((prevState) => !prevState);
  //     } catch (error) {
  //       handleError(error);
  //     }
  //   };

  const sendMessage = async (message) => {
    const content = `${message.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}`;
    const request = new SendMessageRequest(content);
    try {
      await chatRoom_v1.sendMessage(request);
      console.log("Message  sent");
    } catch (error) {
      console.log("error", error);
      handleError(error);
    }
  };

  const sendEvent = async (data) => {
    const formattedData = {
      arn: "arn:aws:ivschat:ap-south-1:625434405715:room/gqSnwq8BSdIq",
      eventName: `${data.eventName}`,
      eventAttributes: data.eventAttributes,
    };

    try {
      const response = await axios.post(
        `http://localhost:3003/create_chat_token`,
        formattedData
      );
      console.info("SendEvent Success:", response.data);
      return response;
    } catch (error) {
      console.error("SendEvent Error:", error);
      return error;
    }
  };

  //#endregion

  return (
    <div className="chatBoxContainer h-100 position-absolute">
      <main className="chat-main">
        <div className="msg left-msg">
          <img
            src="https://picsum.photos/200/300"
            className="msg-img"
            alt="Image"
          />
          <div className="msg-bubble">
            <div className="msg-info">
              <div className="msg-info-name">BOT</div>
              <div className="msg-info-time">12:45</div>
            </div>
            <div className="msg-text">
              Hi, welcome to SimpleChat! Go ahead and send me a message. 😄
            </div>
          </div>
        </div>
        <div className="msg right-msg mt-3">
          <img
            src="https://picsum.photos/200/300"
            className="msg-img"
            alt="Image"
          />
          <div className="msg-bubble">
            <div className="msg-info">
              <div className="msg-info-name">User</div>
              <div className="msg-info-time">12:46</div>
            </div>

            <div className="msg-text">You can change</div>
          </div>
        </div>
        {sentMsg.length > 0 &&
          sentMsg.map((chat) => {
            return (
              <div className="msg right-msg mt-3">
                <img
                  src="https://picsum.photos/200/300"
                  className="msg-img"
                  alt="Image"
                />
                <div className="msg-bubble">
                  <div className="msg-info">
                    <div className="msg-info-name">{chat.username}</div>
                    <div className="msg-info-time">{chat.timeStamp}</div>
                  </div>

                  <div className="msg-text">{chat.msg}</div>
                </div>
              </div>
            );
          })}
      </main>
      <form
        className="msger-inputarea"
        onSubmit={(e) => {
          e.preventDefault();
          handleKeyDown();
        }}
      >
        <div className="chat-icons">
          <AiOutlinePlusCircle />
        </div>
        <div className="chat-icons smiles">
          <LiaSmileSolid />
        </div>
        <input
          type="text"
          className="msger-input"
          name="msg"
          value={formData.msg}
          placeholder="Enter your message..."
          onChange={inputHandler}
        />
        <button type="submit" className="msger-send-btn">
          <span>
            <FiSend />
          </span>
        </button>
      </form>
    </div>
  );
};

export default Chat;
