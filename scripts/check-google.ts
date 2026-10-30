async function checkGoogle() {
  const candidates = [
    'http://localhost:3000/api/auth/google/callback',
    'http://localhost:3000/api/auth/callback/google',
    'http://127.0.0.1:3000/api/auth/google/callback',
    'http://127.0.0.1:3000/api/auth/callback/google',
    'http://localhost:3000',
    'http://localhost:3000/api/auth/callback',
  ];

  for (const uri of candidates) {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=1053556708392-p8o6vee3qnj19p0nm3ifndfcsv5v7o1m.apps.googleusercontent.com&redirect_uri=${encodeURIComponent(uri)}&response_type=code&scope=openid+email+profile&state=test`;
    const res = await fetch(url);
    const text = await res.text();
    const isMismatch = text.includes('redirect_uri_mismatch');
    console.log(`URI "${uri}":`, isMismatch ? 'MISMATCH (not registered)' : 'MATCHED / ACCEPTED!');
  }
}

checkGoogle();
