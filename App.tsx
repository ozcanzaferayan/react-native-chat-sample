/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  FlatList,
  View,
  Text,
  KeyboardAvoidingView,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import ImagePicker from 'react-native-image-picker';

export interface Message {
  user: string;
  timestamp: number;
  text?: string;
  image?: string;
}

export interface ChatState {
  messages: Message[];
}

const emptyMessage: Message = {
  user: 'me',
  timestamp: new Date().getTime(),
  text: '',
};

const domain = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';

let ws: WebSocket;

const App = () => {
  const [message, setMessage] = useState<Message>(emptyMessage);
  const [chat, setChat] = useState<ChatState>({
    messages: [],
  });

  useEffect(() => {
    startWebSocket();
  }, []);

  const startWebSocket = () => {
    console.log('Websocket started.');
    ws = new WebSocket(`ws://${domain}:8080`);

    ws.onmessage = (e) => {
      console.log(`Received: ${e.data}`);
      var msg = JSON.parse(e.data);
      console.log(msg);
      handleReceive(msg);
    };

    ws.onclose = (e) => {
      console.log('Reconnecting: ', e.message);
      setTimeout(startWebSocket, 5000);
    };

    ws.onerror = (e) => {
      console.log(`Error: ${e.message}`);
    };
  };

  const handleReceive = (receivedMsg: Message) => {
    const newChat = {...chat};
    const msg = {...receivedMsg, user: 'otherUser'};
    newChat.messages.push(msg);
    console.log(newChat.messages);
    setChat(newChat);
  };

  const handleSend = () => {
    console.log('Sent: ' + message);
    if (message.text === '') {
      return;
    }
    ws.send(JSON.stringify(message));
    const newChat = {...chat};
    newChat.messages.push({...message});
    setChat(newChat);
    setMessage(emptyMessage);
  };

  const handlePickAndSendImage = () => {
    const options = {
      title: 'Fotoğraf seçiniz',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    ImagePicker.showImagePicker(options, (response) => {
      if (response.didCancel) {
        console.log('Cancelled');
      } else if (response.error) {
        console.log('Error: ', response.error);
      } else if (response.customButton) {
        console.log('Tapped: ', response.customButton);
      } else {
        const dataMsg = {...emptyMessage, image: response.data};
        ws.send(JSON.stringify(dataMsg));
        console.log(response.uri);
        const msg = {
          user: 'me',
          timestamp: new Date().getTime(),
          image: response.uri,
        };
        const newChat = {...chat};
        newChat.messages.push({...msg});
        setChat(newChat);
        setMessage(emptyMessage);
      }
    });
  };

  const handleChangeText = (e: string) => {
    setMessage({
      text: e,
      timestamp: new Date().getTime(),
      user: 'me',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const hoursText = hours < 10 ? `0${hours}` : hours;
    const minutesText = minutes < 10 ? `0${minutes}` : minutes;
    return `${hoursText}:${minutesText}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={chat.messages}
        keyExtractor={(item) => item.timestamp.toString()}
        renderItem={({item}) => (
          <View
            style={{
              ...styles.messageContainer,
              ...(item.user !== 'me' ? styles.messageContainerReceived : {}),
              flex: 1,
            }}>
            {item.image && (
              <Image style={styles.image} source={{uri: item.image}} />
            )}
            {item.text && <Text style={styles.messageText}>{item.text}</Text>}
            <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        enabled={true}
        {...(Platform.OS === 'ios' && {behavior: 'padding'})}
        style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSend}
          value={message.text}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handlePickAndSendImage}>
          <Image
            style={styles.imageButton}
            source={require('./img/photo.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() =>
            message.text!.length > 0 ? handleSend() : console.log()
          }>
          <Text style={styles.sendButtonText}>Gönder</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  messageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    padding: 5,
    backgroundColor: '#1976d2',
    borderRadius: 3,
    marginBottom: 5,
    flexDirection: 'row',
    maxWidth: 300,
  },
  messageContainerReceived: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#00796b',
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    marginEnd: 40,
    padding: 5,
  },
  messageTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginStart: 10,
    position: 'absolute',
    end: 10,
    bottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderColor: '#448aff',
    borderWidth: 1,
    padding: 10,
    borderRadius: 3,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  sendButton: {
    paddingStart: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  imageButton: {
    width: 24,
    height: 24,
    tintColor: '#448aff',
  },
  image: {
    height: 100,
    flex: 1,
  },
  sendButtonText: {color: '#448aff'},
});

export default App;
