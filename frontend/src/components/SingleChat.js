import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ChatContext from "../Context/chat-context";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import io from "socket.io-client";

// Caesar Cipher Encryption
function caesarEncrypt(text, shift) {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (char.match(/[a-z]/i)) {
        const offset = char === char.toLowerCase() ? 97 : 65;
        return String.fromCharCode(((code - offset + shift) % 26) + offset);
      }
      return char;
    })
    .join("");
}

// Caesar Cipher Decryption
function caesarDecrypt(text, shift) {
  return text
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (char.match(/[a-z]/i)) {
        const offset = char === char.toLowerCase() ? 97 : 65;
        return String.fromCharCode(((code - offset - shift + 26) % 26) + offset);
      }
      return char;
    })
    .join("");
}


const ENDPOINT = "http://localhost:5000"; //development
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [decypt, setDecrypt] = useState([])
  const toast = useToast();
  const shift = 3; // Caesar cipher shift value

  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    useContext(ChatContext);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
      };

      

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );

     ;

      console.log(data.length, "fetched messages of the selected chat data");
    for(let  i = 0; i  < data.length; i++) {
      data[i].content = caesarDecrypt(data[i].content, shift);
      
    }
setLoading(true);
  console.log(data.length)
   setMessages(data);
     setLoading(false);
     setDecrypt(data)
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      console.log(error.message);
      toast({
        title: "Error Occurred!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);

      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        // Encrypt the message with Caesar cipher before sending
        const encryptedMessage = caesarEncrypt(newMessage, shift);

        setNewMessage(""); // Clear the input field

        const { data } = await axios.post(
          "/api/message",
          {
            content: encryptedMessage,
            chatId: selectedChat._id, // Corrected this line
          },
          config
        );
         
        socket.emit("new message", data);
        fetchMessages()
        setMessages([...messages, data]);
        console.log(data, "sent message response data");
      } catch (error) {
        console.log(error.message);
        toast({
          title: "Error Occurred!",
          description: "Failed to send the Message",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    fetchMessages()
    selectedChatCompare = selectedChat;
  }, [selectedChat,]);

    useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageReceived.chat._id
      ) {
        if (!notification.includes(newMessageReceived)) {
          setNotification([newMessageReceived, ...notification]);
          setFetchAgain(!fetchAgain);
        } else {
          // Decrypt the message with Caesar cipher before displaying it
         
        }
      }
    });
  }, [messages, notification, newMessage]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;

    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages && !selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    height={40}
                    width={50}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;