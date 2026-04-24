const path = require('path');
const express = require('express');
const { ZingMp3 } = require('zingmp3-api-full-v2');

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function normalizeSearchItems(raw) {
  if (Array.isArray(raw?.data?.songs)) return raw.data.songs;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

app.get('/api/search', async (req, res) => {
  const keyword = (req.query.keyword || req.query.q || '').trim();
  if (!keyword) {
    return res.status(400).json({ error: 'Thiếu từ khóa tìm kiếm' });
  }

  try {
    let result = await ZingMp3.searchAll(keyword, 1, 30);
    let items = normalizeSearchItems(result);

    if (!items.length) {
      result = await ZingMp3.search(keyword);
      if (result?.err !== 0) {
        return res.status(502).json({ error: result?.msg || 'API tìm kiếm đang lỗi' });
      }
      items = normalizeSearchItems(result);
    }

    return res.json({ success: true, data: { items } });
  } catch (error) {
    console.error('[search error]', error);
    return res.status(500).json({ error: 'Có lỗi xảy ra khi tìm kiếm' });
  }
});

app.get('/api/stream', async (req, res) => {
  const id = (req.query.id || '').trim();
  if (!id) {
    return res.status(400).json({ error: 'Thiếu id bài hát' });
  }

  try {
    const result = await ZingMp3.getSong(id);
    console.log('[stream] Zing result:', { err: result?.err, msg: result?.msg, hasData: !!result?.data });

    if (result?.err !== 0) {
      throw new Error(result?.msg || 'Zing API error');
    }

    const streamData = result?.data || {};
    const streamUrl = streamData['128'] || streamData['320'] || null;

    if (!streamUrl) {
      console.warn('[stream] Zing returned no URL, data keys:', Object.keys(streamData));
      throw new Error('no stream url from Zing');
    }

    return res.json({ success: true, data: { streamUrl } });
  } catch (err) {
    console.warn('[stream] Zing failed:', err.message);

    // Fallback to iTunes preview (30s)
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
      const itunesData = await itunesRes.json();
      const track = itunesData?.results?.[0];
      if (track?.previewUrl) {
        console.log('[stream] iTunes fallback OK');
        return res.json({ success: true, data: { streamUrl: track.previewUrl } });
      }
      console.warn('[stream] iTunes fallback: no previewUrl');
    } catch (e) {
      console.error('[stream] iTunes fallback error:', e);
    }

    return res.status(502).json({ error: 'Không lấy được link phát (Zing bị chặn/IP khác)' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
