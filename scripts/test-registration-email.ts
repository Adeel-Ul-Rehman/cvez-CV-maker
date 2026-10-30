async function testRegister() {
  console.log('Sending registration request for davidbenjamin8990@gmail.com...');
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'davidbenjamin8990@gmail.com',
      fullName: 'David Benjamin',
      password: 'MyPassword123!',
    }),
  });

  const json = await res.json();
  console.log('Registration response status:', res.status);
  console.log('Registration response body:', json);

  if (res.ok && json.ok) {
    console.log('SUCCESS! Registration was accepted and OTP email was dispatched via Gmail SMTP.');
  } else {
    console.error('Registration failed:', json);
  }
}

testRegister().catch(console.error);
