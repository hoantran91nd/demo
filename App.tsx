import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {isEqual} from 'lodash';
import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  Button,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import {imagePath} from './src/common/constants/imagePath.constant';
import InputModal, {InputModalService} from './src/components/InputModal';

const {width} = Dimensions.get('screen');

let interval: any = null;

function App() {
  const [hasPermission, setHasPermission] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [notiCode, setNotiCode] = useState('');
  const [data, setData] = useState({
    name: undefined,
    battery: undefined,
    distanceLeft: undefined,
    odo: undefined,
    position: undefined,
  });

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
            .collection('pega')
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

  const onPressChangeCode = () => {
    InputModalService.show({
      textOk: 'Xác nhận',
      onOk: async notiCode => {
        if (notiCode) {
          setNotiCode(notiCode);
          await AsyncStorage.setItem('notiCode', notiCode);
        }
        InputModalService.dismiss();
      },
      title: 'Nhập mật khẩu nhận thông báo',
    });
  };

  return (
    <ImageBackground
      resizeMode="stretch"
      source={imagePath.BACKGROUND}
      style={styles.bg}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.text}>Pega-S của {data?.name}</Text>
          <Image source={imagePath.DEVICE} style={styles.device} />
          <TouchableOpacity
            style={[styles.btn, {marginBottom: 10}]}
            onPress={() => {
              firestore()
                .collection('services')
                .doc(notiCode)
                .get()
                .then(record => {
                  if (record.data()) {
                    setData({
                      name: record.data()?.name || undefined,
                      battery: record.data()?.battery || undefined,
                      distanceLeft: record.data()?.distanceLeft || undefined,
                      odo: record.data()?.odo || undefined,
                      position: record.data()?.position || '',
                    });
                  }
                });
            }}>
            <Text style={styles.text}>Cập nhật thông tin</Text>
          </TouchableOpacity>
          <View style={styles.flex}>
            <Text style={styles.text}>Trạng thái hoạt động:</Text>
            <Text style={styles.text}>Tốt</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.text}>Mức pin còn lại:</Text>
            <Text style={styles.text}>{data?.battery}V</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.text}>Quãng đường còn lại:</Text>
            <Text style={styles.text}>{data?.distanceLeft} Km</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.text}>Số Km đã đi được:</Text>
            <Text style={styles.text}>{data?.odo} Km</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.text}>Mã nhận thông báo:</Text>
            <Text style={styles.text}>{notiCode}</Text>
            <TouchableOpacity style={styles.btn} onPress={onPressChangeCode}>
              <Text style={styles.text}>Thay đổi</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flex}>
            <Text style={styles.text}>Vị trí của xe hiện tại:</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                if (data.position) {
                  Linking.canOpenURL(data.position).then(canOpen => {
                    if (canOpen) {
                      Linking.openURL(data.position);
                    }
                  });
                }
              }}>
              <Text style={styles.text}>Xem</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flex}>
            <Text onPress={handleOnPressPermissionButton} style={styles.link}>
              Cấp quyền truy cập thông báo
            </Text>
            <View />
          </View>
          {/* <TextInput
            editable={isEdit}
            value={notiCode}
            onChangeText={(value: string) => setNotiCode(value.toString())}
            style={styles.textInput}
            disableFullscreenUI
          /> */}
        </View>
      </SafeAreaView>
      <InputModal ref={_ref => InputModalService.setRef(_ref)} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
  },
  device: {
    height: 240,
    width: 240,
  },
  btn: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  flex: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    marginVertical: 3,
    alignItems: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    color: '#34C759',
  },
  container: {
    // flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  textInput: {
    backgroundColor: 'rgb(33, 150, 243)',
    marginBottom: 20,
    color: '#FFFFFF',
    // fontSize: 18,
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

  content: {
    // justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    // width: '100%',
  },
});

export default App;
