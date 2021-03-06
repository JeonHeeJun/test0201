import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, StackActions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MainTabScreen from './screens/MainTabScreen';
import MainScreen from './screens/MainScreen';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HeaderScreen from './screens/Header';
import RootStackScreen from './screens/RootStackScreen';

import { AuthContext } from './components/context';
import AsyncStorage from '@react-native-community/async-storage';

// 통신 패키지 
import { ApolloClient, ApolloProvider, InMemoryCache, useMutation, useQuery } from "@apollo/client";
import {LOGIN} from './queries';

const client = new ApolloClient({
  uri: "https://countries.trevorblades.com",
  cache: new InMemoryCache(),
});

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

export default function App() {
  //const [isLoading, setIsLoading] = React.useState(true);
  //const [userToken, setUserToken] = React.useState(null);

  const [loginMutation] = useMutation(LOGIN);

  const initialLoginState = {
    isLoading: true,
    userName: null,
    userToken: null,
  };

  const loginReducer = (prevState, action) => {
    switch (action.type){
      case 'RETRIEVE_TOKEN':
        return {
          ...prevState,
          userToken: action.token,
          isLoading: false,
        };    
      case 'LOGIN':
        return {
          ...prevState,
          userName: action.id,
          userToken: action.token,
          isLoading: false,
        };  
      case 'LOGOUT':
        return {
          ...prevState,
          userName: null,
          userToken: null,
          isLoading: false,
        };  
      case 'REGISTER':
        return {
          ...prevState,
          userName: action.id,
          userToken: action.token,
          isLoading: false,
        };
    }
  };

  const [loginState, dispatch] = React.useReducer(loginReducer, initialLoginState);

  const authContext = React.useMemo(() => ({
    signIn: async (userName, password) => {
      //setUserToken('abc');
      //setIsLoading(false);
      let userToken;
      userToken = await loginMutation({
        variables: {
          email: userName,
          password: password
        }
      });

      if (userName == 'user' && password == '123'){
        userToken = 'abc';
        try{
          await AsyncStorage.setItem('userToken', userToken);
        }catch(e){
          console.log(e);
        }
        
      }
      console.log('user: ', userName);
      console.log('pass: ', password);
      console.log('user token: ', userToken);
      dispatch({ type: "LOGIN", id: userName, token: userToken});
    },
    signOut: async () => {
      //setUserToken(null);
      //setIsLoading(false);
      try{
        userToken = await AsyncStorage.removeItem('userToken');
      }catch(e){
        console.log(e);
      }
      dispatch({ type: "LOGOUT" });

    },
    signUp: () => {
      //setUserToken('abc');
      //setIsLoading(false);
    }
  }));

  useEffect(() => {
    setTimeout(async () => {
      let userToken;
      userToken = null;
      try{
        userToken = await AsyncStorage.getItem('userToken');
      }catch(e){
        console.log(e);
      }
      console.log('user token: ', userToken);
      dispatch({ type: "RETRIEVE_TOKEN", token: userToken});
    }, 3000);
  }, []);

  if (loginState.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }
  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {loginState.userToken !== null ? (
          <MainScreen />
        ):(
          <RootStackScreen />
        )}

      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});