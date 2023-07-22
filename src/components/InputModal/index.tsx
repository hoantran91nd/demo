/* eslint-disable react-native/no-inline-styles */
import React, {useImperativeHandle, useState} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const {width} = Dimensions.get('screen');

export class InputModalService {
  static ref?: inputModalMethod;

  // Lưu ref lại
  static setRef(_ref: any) {
    this.ref = _ref;
  }

  static show(params: RenderParams) {
    if (!this.ref) {
      return;
    }

    this.ref.show(params);
  }

  static dismiss() {
    if (!this.ref) {
      return;
    }
    this.ref.dismiss();
  }
}

interface RenderParams {
  title: string;
  textOk?: string;
  onOk?: (notiCode?: string) => void;
}

interface inputModalMethod {
  show: (params: RenderParams) => void;
  dismiss: () => void;
}

interface inputModalProps {}
const InputModal: React.ForwardRefRenderFunction<
  inputModalMethod,
  inputModalProps
> = (props, ref) => {
  const [visible, setVisible] = useState(false);
  const [renderParams, setRenderParams] = useState<RenderParams>({
    title: '',
    textOk: '',
    onOk: () => {},
  });
  const [code, setCode] = useState('');

  const show = (params: RenderParams) => {
    setVisible(true);
    setRenderParams(params);
  };

  const dismiss = () => {
    setVisible(false);
  };

  // Export method outside

  useImperativeHandle(ref, () => ({
    show,
    dismiss,
  }));

  if (!visible) {
    return null;
  }
  const _renderBody = () => {
    return (
      <View
        style={{
          position: 'absolute',
          bottom: '40%',
          right: (width - 210) / 2,
        }}>
        <View style={styles.container}>
          <Text style={styles.popupTitle}>Nhập mã ID của xe</Text>
          <TextInput
            disableFullscreenUI={true}
            onChangeText={t => setCode(t)}
            style={{
              marginVertical: 10,
              width: 150,
              backgroundColor: '#FFF',
              textAlign: 'center',
            }}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => {
                if (renderParams.onOk) {
                  renderParams.onOk(code);
                }
              }}>
              <Text style={styles.nextText}>{renderParams.textOk}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  return _renderBody();
};
const WithInputModal = React.forwardRef(InputModal);

export default WithInputModal;
const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: 'space-between',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0f3b57',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  popupSubtitle: {
    fontSize: 14,
    opacity: 0.75,
    lineHeight: 20,
  },
  viewCloseIcon: {
    position: 'absolute',
    right: 10,
  },
  nextButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  nextText: {
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 100,
    color: '#F2F2F7',
  },
});
