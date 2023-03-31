import NextAuth from 'next-auth';
// import {Provider} from 'next-auth/providers';
const options = {
  providers: [
    Provider.Credentials({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
          placeholder: 'john.doe@example.com',
        },
        password: {label: 'Password', type: 'password'},
      },
      authorize: async (credentials) => {
        const {email, password} = credentials;
        // If the credentials are invalid, return null
        return null;
      },
    }),
  ],
  session: {
    jwt: true,
  },
  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, token) {
      session.user.id = token.id;
      return session;
    },
  },
};

export default (req, res) => NextAuth(req, res, options);
