// Hai Tran 14 APR 2022 
// Basic auth flow with Amplify Authenticator and useAuthenticator 
// useAuthenticator hook enable access to auth state and prevent re-render
// Authenticator UI can be customized 
// 

import './App.css';
import { Amplify } from 'aws-amplify';
import {
  Authenticator,
  useAuthenticator
} from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ChakraProvider } from '@chakra-ui/react';
import HomePage from './components/Home';
import awsmobile from './aws-exports';


Amplify.configure(awsmobile);


function App() {

  const { user, signOut } = useAuthenticator((context) => [context.user]);

  const LoginPage = () => {

    // custom formfields
    const formfields = {
      signIn: {
        username: {
          placeholder: 'minh@entest.io'
        },
        password: {
          placeholder: 'minh2022'
        }
      }
    }

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <Authenticator formFields={formfields}></Authenticator>
      </div>
    );
  }

  return user ? <HomePage user={user} signOut={signOut}></HomePage> : <LoginPage></LoginPage>
}

export default () => (
  <ChakraProvider>
    <Authenticator.Provider>
      <App></App>
    </Authenticator.Provider>
  </ChakraProvider>
);
