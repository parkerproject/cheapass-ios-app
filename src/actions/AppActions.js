export const HANDLE_INITIAL_APP_LOAD = 'HANDLE_INITIAL_APP_LOAD';
export const INIT_APP_WITH_LOGIN = 'INIT_APP_WITH_LOGIN';
export const INIT_APP_WITH_DASHBOARD = 'INIT_APP_WITH_DASHBOARD';
export const HANDLE_CHANGE_EMAIL = 'HANDLE_CHANGE_EMAIL';
export const HANDLE_SUBMIT_EMAIL = 'HANDLE_SUBMIT_EMAIL';
export const HANDLE_CHANGE_OTP = 'HANDLE_CHANGE_OTP';
export const HANDLE_SUBMIT_OTP = 'HANDLE_SUBMIT_OTP';
export const HANDLE_SUBMIT_OTP_SUCCESS = 'HANDLE_SUBMIT_OTP_SUCCESS';
export const HANDLE_SUBMIT_OTP_FAILURE = 'HANDLE_SUBMIT_OTP_FAILURE';
export const HANDLE_OTP_SENT = 'HANDLE_OTP_SENT';
export const HANDLE_EMAIL_FAILURE = 'HANDLE_EMAIL_FAILURE';
export const HANDLE_RESEND_OTP = 'HANDLE_RESEND_OTP';
export const HANDLE_RESEND_OTP_SUCCESS = 'HANDLE_RESEND_OTP_SUCCESS';
export const HANDLE_RESEND_OTP_FAILURE = 'HANDLE_RESEND_OTP_FAILURE';
export const HANDLE_RELOAD_ALERTS = 'HANDLE_RELOAD_ALERTS';

import {
  AsyncStorage
} from 'react-native';

import {
  STORAGE_KEY_IS_LOGGED_IN,
  STORAGE_KEY_EMAIL,
  STORAGE_KEY_IS_INSTALLED
} from '../config/keys';

import API from '../apis/API';
import PushManager from '../components/RemotePushIOS';

function navigateToDashboard ({dispatch, email}) {
  API.getDashboard(email)
  .then((response) => {
    dispatch({
      type: INIT_APP_WITH_DASHBOARD,
      email, response
    });
  });

  PushManager.requestPermissions((err, data) => {
    if (err) {
      console.log('Could not register for push');
    } else {
      API.requestAppInstallation({
        email: email,
        parsePayload: {
          'deviceType': 'ios',
          'deviceToken': data.token,
          'channels': ['global']
        }
      })
      .then((response) => {
        if (response.status === 'ok') {
          AsyncStorage.setItem(STORAGE_KEY_IS_INSTALLED, 'true');
        }
      })
      .catch(e => {
        console.log('exception caught in _handleAppInstallation ', e);
      });
    }
  });
}

export function handleInitialAppLoad () {
  return (dispatch) => {
    dispatch({
      type: HANDLE_INITIAL_APP_LOAD
    });

    AsyncStorage
    .getItem(STORAGE_KEY_IS_LOGGED_IN)
    .then((isLoggedInValue) => {
      if (isLoggedInValue === null || isLoggedInValue === 'false') {
        return dispatch({
          type: INIT_APP_WITH_LOGIN
        });
      }

      // user has a logged in session
      AsyncStorage
      .getItem(STORAGE_KEY_EMAIL)
      .then((email) => {
        navigateToDashboard({dispatch, email});
      });
    });
  };
}

export function handleLogout () {
  return (dispatch) => {
    dispatch({
      type: HANDLE_INITIAL_APP_LOAD
    });
    AsyncStorage
    .setItem(STORAGE_KEY_IS_LOGGED_IN, 'false')
    .then(() => {
      return dispatch({
        type: INIT_APP_WITH_LOGIN
      });
    });
  };
}

export function handleChangeEmail ({email}) {
  return {
    type: HANDLE_CHANGE_EMAIL,
    email
  };
}

export function handleSubmitEmail () {
  return (dispatch, getState) => {
    dispatch({
      type: HANDLE_SUBMIT_EMAIL
    });

    const { email } = getState().app.login;

    API.requestOTP({email})
    .then((response) => {
      if (response.status === 'error') {
        const errorMessage = response.message;
        return dispatch({
          type: HANDLE_EMAIL_FAILURE,
          error: errorMessage
        });
      }

      dispatch({
        type: HANDLE_OTP_SENT
      });
    })
    .catch((e) => console.log('error caught in request OTP ', e));
  };
}

export function handleChangeOTP ({otp}) {
  return {
    type: HANDLE_CHANGE_OTP,
    otp
  };
}

export function handleSubmitOTP () {
  return (dispatch, getState) => {
    dispatch({
      type: HANDLE_SUBMIT_OTP
    });

    const { email, otp } = getState().app.login;


    API.verifyOTP({email, 'verify_code': otp})
    .then((response) => {
      if (response.status) {
        dispatch({
          type: HANDLE_SUBMIT_OTP_SUCCESS
        });
        AsyncStorage.setItem(STORAGE_KEY_IS_LOGGED_IN, 'true');
        AsyncStorage.setItem(STORAGE_KEY_EMAIL, email);
        return navigateToDashboard({dispatch, email});
      }

      dispatch({
        type: HANDLE_SUBMIT_OTP_FAILURE
      });
    });

  };
}

export function handleResendOTP () {
  return (dispatch, getState) => {
    dispatch({
      type: HANDLE_RESEND_OTP
    });

    const { email } = getState().app.login;

    API.requestOTP({email})
    .then((response) => {
      if (response.status === 'ok') {
        return dispatch({
          type: HANDLE_RESEND_OTP_SUCCESS
        });
      }

      dispatch({
        type: HANDLE_RESEND_OTP_FAILURE
      });
    });
  };
}

export function handleReloadAlerts () {
  return (dispatch, getState) => {
    const { email } = getState().app.login;
    API.getDashboard(email)
    .then(response => {
      dispatch({
        type: HANDLE_RELOAD_ALERTS,
        response
      });
    });
  };
}
