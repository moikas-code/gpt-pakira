import {SessionProvider} from 'next-auth/react';
import Link from 'next/link';

function MyApp({Component, pageProps}: any) {
  return (
    <>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
