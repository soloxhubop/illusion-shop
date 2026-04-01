const axios = require('axios');

const CLIENT_ID = '1488976675185102980';
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://illusion-shop.vercel.app/callback';

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) return res.redirect('/');

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const user = userRes.data;

    // Redirect al sito con i dati utente nell'URL
    res.redirect(`/?logged_in=true&username=${encodeURIComponent(user.username)}&avatar=${user.avatar}&id=${user.id}`);

  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.redirect('/?error=auth_failed');
  }
}
