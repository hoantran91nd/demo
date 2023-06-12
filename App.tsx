import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {isEqual} from 'lodash';
import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  Button,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';

const {width} = Dimensions.get('screen');

let interval: any = null;

function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [isEdit, setEdit] = useState(false);
  const [notiCode, setNotiCode] = useState('');

  useEffect(() => {
    const getNotiFromStore = async () => {
      const data = await AsyncStorage.getItem('notiCode');
      if (data) {
        setNotiCode(data?.toString());
      }
    };
    getNotiFromStore();
  }, []);

  const handleOnPressPermissionButton = async () => {
    /**
     * Open the notification settings so the user
     * so the user can enable it
     */
    RNAndroidNotificationListener.requestPermission();
  };

  const handleAppStateChange = async (nextAppState: string, force = false) => {
    if (nextAppState === 'active' || force) {
      const status = await RNAndroidNotificationListener.getPermissionStatus();
      setHasPermission(status !== 'denied');
    }
  };

  const handleCheckNotificationInterval = useCallback(
    async (notification: {title: any; text: any; bigText: any}) => {
      const lastStoredNotification = await AsyncStorage.getItem(
        '@lastNotification',
      );
      if (lastStoredNotification) {
        /**
         * As the notification is a JSON string,
         * here I just parse it
         */
        if (
          !isEqual(
            notification?.title,
            JSON.parse(lastStoredNotification)?.title,
          ) ||
          !isEqual(
            notification?.text,
            JSON.parse(lastStoredNotification)?.text,
          ) ||
          (!isEqual(
            notification?.bigText,
            JSON.parse(lastStoredNotification)?.bigText,
          ) &&
            JSON.parse(lastStoredNotification)?.app !== 'com.android.systemui')
        ) {
          setLastNotification(JSON.parse(lastStoredNotification));
          firestore()
            .collection('test')
            .doc(notiCode)
            .set({
              title: JSON.parse(lastStoredNotification)?.title,
              text: JSON.parse(lastStoredNotification)?.text,
              bigText: JSON.parse(lastStoredNotification)?.bigText,
            })
            .then(() => {
              console.log('User added!');
            });
        }
      }
    },
    [lastNotification, notiCode],
  );

  useEffect(() => {
    clearInterval(interval);

    /**
     * Just setting a interval to check if
     * there is a notification in AsyncStorage
     * so I can show it in the application
     */
    interval = setInterval(
      () => handleCheckNotificationInterval(lastNotification),
      3000,
    );

    const listener = AppState.addEventListener('change', handleAppStateChange);

    handleAppStateChange('', true);

    return () => {
      clearInterval(interval);
      listener.remove();
    };
  }, [lastNotification]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonWrapper}>
        <Text
          style={[
            styles.permissionStatus,
            {color: hasPermission ? 'green' : 'red'},
          ]}>
          {hasPermission
            ? 'Allowed to handle notifications'
            : 'NOT allowed to handle notifications'}
        </Text>
        <Button
          title="Mở cài đặt"
          onPress={handleOnPressPermissionButton}
          disabled={hasPermission}
        />
        <Text style={styles.title}>Mã thông báo</Text>
        <TextInput
          editable={isEdit}
          value={notiCode}
          onChangeText={(value: string) => setNotiCode(value.toString())}
          style={styles.textInput}
          disableFullscreenUI
        />
        <Button
          title={isEdit ? 'Lưu' : 'Cập nhật'}
          onPress={async () => {
            if (isEdit) {
              await AsyncStorage.setItem('notiCode', notiCode);
              setEdit(false);
            } else {
              setEdit(true);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: 'rgb(33, 150, 243)',
    minWidth: '30%',
    marginBottom: 20,
    color: '#FFFFFF',
    height: 40,
    fontSize: 18,
    lineHeight: 18,
    textAlign: 'center',
  },
  title: {
    marginTop: 50,
    fontSize: 20,
  },
  permissionStatus: {
    marginBottom: 20,
    fontSize: 18,
  },

  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
});

export default App;
