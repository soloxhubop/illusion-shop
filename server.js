const express = require('express');
const axios = require('axios');
const session = require('express-session');
const path = require('path');

const app = express();

const CLIENT_ID = '1488976675185102980';
const CLIENT_SECRET = process.env.CLIENT_SECRET; // messo in sicurezza su Vercel
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://illusion-shop.vercel.app/callback';
const DISCORD_SERVER = 'https://discord.gg/unmShz2MW';

app.use(session({
  secret: process.env.SESSION_SECRET || 'illusion_secret_key',
  resave: false,
  saveUninitialized: false,
}));

app.use(express.static(path.join(__dirname, 'public')));

// Login con Discord
app.get('/login', (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify+email+guilds&prompt=consent`;
  res.redirect(url);
});

// Callback dopo il login
app.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/');

  try {
    // Scambia il codice per un token
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

    // Prendi i dati dell'utente
    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    req.session.user = {
      id: userRes.data.id,
      username: userRes.data.username,
      avatar: userRes.data.avatar,
    };

    res.redirect('/shop');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Pagina shop (solo se loggato)
app.get('/shop', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

// API: dati utente
app.get('/api/user', (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Illusion Shop running on port ${PORT}`));
