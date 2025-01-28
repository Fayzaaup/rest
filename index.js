const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 5000;
const axios = require("axios")
const { default: makeWaSocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { setTimeout: sleep } = require('timers/promises');




// Middleware
app.enable("trust proxy");
app.set("json spaces", 2);
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Endpoint untuk servis dokumen HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/api', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get("/api/downloader/tiktok", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "URL is required." });

  try {
    const { tiktokdl } = require("tiktokdl");
    const data = await tiktokdl(url);
    if (!data) return res.status(404).json({ error: "No data found." });
    res.json({ status: true, creator: "HexaNeuro", result: data });
  } catch (e) {
    res.status(500).json({ error: "Internal server error." });
  }
});

app.get('/api/orkut/createpayment', async (req, res) => {
    const { amount, codeqr } = req.query;
    if (!amount) {
        return res.status(400).json({ status: false, message: "Isi parameter 'amount'." });
    }
    if (!codeqr) {
        return res.status(400).json({ status: false, message: "Isi parameter 'codeqr' menggunakan QRIS code kalian." });
    }

    try {
        const response = await fetch(`https://rafaelxd.tech/api/orkut/createpayment?&amount=${amount}&codeqr=${codeqr}`);
        if (!response.ok) {
            throw new Error(`Error dari API eksternal: ${response.statusText}`);
        }
        const qrData = await response.json();
        res.json({ status: true, creator: "HexaNeuro", result: qrData.result });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

app.get('/api/orkut/cekstatus', async (req, res) => {
    const { merchant, keyorkut } = req.query;

    if (!merchant) {
        return res.status(400).json({ 
            status: false, 
            creator: "HexaNeuro", 
            message: "Isi parameter 'merchant'." 
        });
    }
    if (!keyorkut) {
        return res.status(400).json({ 
            status: false, 
            creator: "HexaNeuro", 
            message: "Isi parameter 'keyorkut'." 
        });
    }

    try {
        const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
        const response = await axios.get(apiUrl);
        const result = response.data;

        const latestTransaction = result.data && result.data.length > 0 ? result.data[0] : null;
        if (latestTransaction) {
            res.json({
                status: true,
                creator: "HexaNeuro",
                message: "Berhasil mendapatkan transaksi.",
                result: latestTransaction,
            });
        } else {
            res.json({
                status: false,
                creator: "HexaNeuro",
                message: "Tidak ada transaksi ditemukan.",
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            creator: "HexaNeuro",
            message: "Terjadi kesalahan saat mengambil data.",
            error: error.message,
        });
    }
});

app.get("/api/tools/translate", async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ error: "Text is required." });

  try {
    const response = await axios.get(`https://api.siputzx.my.id/api/tools/translate`, {
      params: { text: text, source: "auto", target: "id" }
    });
    res.json({ status: true, creator: "HexaNeuro", result: response.data.translatedText });
  } catch {
    res.status(500).json({ error: "An error occurred while processing the translation." });
  }
});


app.get("/api/downloader/spotify", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Url is required." });
    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/spotify?url=${url}`);
        const data = response.data;
        if (!data.metadata || !data.download) {
            return res.status(500).json({ error: "Invalid response from the external API." });
        }
        res.json({
            status: true,
            creator: "HexaNeuro",
            result: {
                artis: data.metadata.artist,
                judul: data.metadata.name,
                rilis: data.metadata.releaseDate,
                thumbnail: data.metadata.cover_url,
                download_url: data.download
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from the external API." });
    }
});

app.get("/api/downloader/ytmp3", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Url is required." });

    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/youtube?q=${url}`);
        const data = response.data;

        res.json({
            status: true,
            creator: "HexaNeuro",
            result: {
                Judul: data.data.title,
                thumbnail: data.data.thumbnailUrl,
                durasi: data.data.duration,
                UrlDownload: data.data.sounds
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});

app.get("/api/downloader/ytmp4", async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Url is required." });

    try {
        const response = await axios.get(`https://api.siputzx.my.id/api/d/youtube?q=${url}`);
        const data = response.data;

        res.json({
            status: true,
            creator: "HexaNeuro",
            result: {
                Judul: data.data.title,
                thumbnail: data.data.thumbnailUrl,
                durasi: data.data.duration,
                UrlDownload: data.data.video
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching data." });
    }
});

app.get('/api/ff-stalk', async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ status: false, creator: "HexaNeuro", message: "Isi parameter 'id'." });
    }

    try {
        const apiUrl = `https://vapis.my.id/api/ff-stalk?id=${id}`;
        const response = await axios.get(apiUrl);
        const result = response.data;

        if (result.status) {
            res.json({
                status: true,
                creator: "HexaNeuro",
                account: {
                    id: result.data.account.id,
                    name: result.data.account.name,
                    level: result.data.account.level,
                    xp: result.data.account.xp,
                    region: result.data.account.region,
                    like: result.data.account.like,
                    bio: result.data.account.bio,
                    create_time: result.data.account.create_time,
                    last_login: result.data.account.last_login,
                    honor_score: result.data.account.honor_score,
                    booyah_pass: result.data.account.booyah_pass,
                    booyah_pass_badge: result.data.account.booyah_pass_badge,
                    evo_access_badge: result.data.account.evo_access_badge,
                    equipped_title: result.data.account.equipped_title,
                    BR_points: result.data.account.BR_points,
                    CS_points: result.data.account.CS_points
                },
                guild: {
                    name: result.data.guild.name,
                    id: result.data.guild.id,
                    level: result.data.guild.level,
                    member: result.data.guild.member,
                    capacity: result.data.guild.capacity
                },
                pet_info: {
                    name: result.data.pet_info.name,
                    level: result.data.pet_info.level,
                    type: result.data.pet_info.type,
                    xp: result.data.pet_info.xp
                },
                ketua_guild: {
                    id: result.data.ketua_guild.id,
                    name: result.data.ketua_guild.name,
                    level: result.data.ketua_guild.level,
                    xp: result.data.ketua_guild.xp,
                    create_time: result.data.ketua_guild.create_time,
                    last_login: result.data.ketua_guild.last_login,
                    BP_bagdes: result.data.ketua_guild.BP_bagdes,
                    BR_points: result.data.ketua_guild.BR_points,
                    CS_points: result.data.ketua_guild.CS_points,
                    like: result.data.ketua_guild.like,
                    equipped_title: result.data.ketua_guild.equipped_title
                }
            });
        } else {
            res.status(404).json({ status: false, creator: "HexaNeuro", message: "Data tidak ditemukan." });
        }
    } catch (error) {
        res.status(500).json({ status: false, creator: "HexaNeuro", message: "Terjadi kesalahan saat mengambil data." });
    }
});

app.get("/api/downloader/spotifys", async (req, res) => {
    try {
        const { judul } = req.query;
        if (!judul) {
            return res.status(400).json({ error: "Masukkan judul lagu." });
        }
        const response = await axios.get(`https://api.siputzx.my.id/api/s/spotify?query=${encodeURIComponent(judul)}`);
        const resultData = response.data.data[0];
        if (!resultData) {
            return res.status(404).json({ error: "Lagu tidak ditemukan." });
        }
        res.json({
            status: true,
            creator: "HexaNeuro",
            result: {
                judul: resultData.title,
                artis: resultData.artist.name,
                thumbnail: resultData.thumbnail,
                url: resultData.artist.external_urls.spotify
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan pada server." });
    }
});


app.use((req, res, next) => {
  res.status(404).send("Sorry can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



