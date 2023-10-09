import React,{useEffect} from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

const HomePage = () => {

  const navigate = useNavigate();

  useEffect(() => {
    const userInformation = JSON.parse(localStorage.getItem("userInformation"));

    if (userInformation) navigate("/chats");
  }, [navigate]);

  return (
    <Container maxW="xl" centerContent>
      <Box
        d="flex"
        justifyContent="center"
        margin="3.2rem 0 1rem 0"
        p={3}
        borderRadius="lg"
        borderColor="black"
        borderWidth="3px"
        w="100%"
        bg="gold.700"
      >
        <Text color="white" fontSize="4xl" fontFamily="Anton" fontWeight="bold">
          C H A T Z
        </Text>
      </Box>
      <Box
        bg="black.50"
        w="100%"
        p={4}
        borderRadius="lg"
        borderColor="black"
        borderWidth="3px"
      >
        <Tabs isFitted variant="soft-rounded" colorScheme="black">
          <TabList mb="1em">
            <Tab fontWeight="bold" color={"white"}>
              Login
            </Tab>
            <Tab fontWeight="bold" color={"white"}>
              Sign Up
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default HomePage;
