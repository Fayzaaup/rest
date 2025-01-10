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
        const response = await fetch(`https://rafaelxd.tech/api/orkut/createpayment?apikey=rafael&amount=${amount}&codeqr=${codeqr}`);
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

    // Validasi parameter
    if (!merchant || !keyorkut) {
        return res.status(400).json({
            status: false,
            creator: "HexaNeuro",
            message: "Isi parameter 'merchant' dan 'keyorkut' dengan benar."
        });
    }

    try {
        const url = `https://rafaelxd.tech/api/orkut/cekstatus?apikey=rafael&merchant=${merchant}&keyorkut=${keyorkut}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Error dari API eksternal: ${response.statusText}`);
        }

        const data = await response.json();

        // Respon sukses
        if (data.status && data.result) {
            res.json({
                status: true,
                creator: "HexaNeuro",
                transaction: {
                    date: data.result.date || "Tidak tersedia",
                    amount: data.result.amount || "Tidak tersedia",
                    type: data.result.type || "Tidak tersedia",
                    qris: data.result.qris || "Tidak tersedia",
                    balance: data.result.balance || "Tidak tersedia",
                }
            });
        } else {
            res.status(500).json({
                status: false,
                creator: "HexaNeuro",
                message: "Respon tidak valid dari API eksternal."
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            creator: "HexaNeuro",
            message: error.message
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



