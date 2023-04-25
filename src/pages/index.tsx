import {useSession} from 'next-auth/react';
import Head from 'next/head';
import {useEffect} from 'react';
import Chat from '../components/Chat';
import {useRouter} from 'next/router';

const Index = () => {
  const router = useRouter();
  //   const {data: session, status} = useSession();

  //  // Redirect to the login page if the user is not logged in
  //   useEffect(() => {
  //     if (status === 'unauthenticated') {
  //       router.push('/login');
  //     }
  //   }, [status, router]);

  // Show a loading message while checking the session status
  // if (status === 'loading') {
  //   return <div>Loading...</div>;
  // }

  // Render the chatbot UI if the user is logged in

  return (
    <div>
      <style global jsx>{`
        html,
        body {
          height: 500px;
          width: 500px;
          margin: 0px !important;
        }
        .nav {
          width: 100%;
          display: flex;
          justify-content: end;
        }
      `}</style>
      <Head>
        <title>PAKIRA</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <Chat />
      </main>
    </div>
  );
};

export default Index;
