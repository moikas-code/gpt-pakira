import {signIn} from 'next-auth/react';

export default function LoginPage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/', // Redirect to homepage after successful login
    });
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='email'>Email</label>
          <input type='text' id='email' required />
        </div>
        <div>
          <label htmlFor='password'>Password</label>
          <input type='password' id='password' required />
        </div>
        <button type='submit'>Log in</button>
      </form>
    </div>
  );
}
