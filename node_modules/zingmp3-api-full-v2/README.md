# Zing Mp3 API


### Original packages
[https://www.npmjs.com/package/zingmp3-api-full](https://www.npmjs.com/package/zingmp3-api-full)

### ⚠️ Please create server use module **zingmp3-api-full** + **Node.js** + **Express.js**

### Based module [ZingMp3API](https://github.com/whoant/ZingMp3API).

## Usage

### How to get song ID? you can read my [post](https://vovanhoangtuan.medium.com/t%C3%B4i-%C4%91%C3%A3-l%E1%BA%A5y-api-zingmp3-nh%C6%B0-th%E1%BA%BF-n%C3%A0o-55f5fa555eda).

Example:

> https://zingmp3.vn/api/v2/song/get/streaming?id=ZOACFBBU&ctime=1641375546&version=1.5.4&sig=f9ecb61628fad98d3d5d04fa40d3246af6817b2bab1a52674cf218770637497308060f943b0677318754cf2099564689ab1163c31bd2682aa94905804369dc23&apiKey=88265e23d4284f25963e6eedac8fbfa3

=> ID: ZOACFBBU

### Get Song
> param {id}
```javascript
ZingMp3.getSong("ZOACFBBU").then((data) => {
  console.log(data)
})
```

### Get Detail Playlist
> param {id}
```javascript
ZingMp3.getDetailPlaylist("ZWZB969E").then((data) => {
  console.log(data)
})
```

### Get Home

```javascript
ZingMp3.getHome().then((data) => {
  console.log(data)
})
```

### Get Top 100
```javascript
ZingMp3.getTop100().then((data) => {
  console.log(data)
})
```

### Get Chart Home
```javascript
ZingMp3.getChartHome().then((data) => {
  console.log(data)
})
```

### Get New Release Chart
```javascript
ZingMp3.getNewReleaseChart().then((data) => {
  console.log(data)
})
```

### Get Song Info
> param {id}
```javascript
ZingMp3.getInfoSong("ZOACFBBU").then((data) => {
  console.log(data)
})
```

### Get Artist
> param {name} : sontungmtp
```javascript
ZingMp3.getArtist("sontungmtp").then((data) => {
  console.log(data)
})
```

### Get Lyric Song
> param {id}
```javascript
ZingMp3.getLyric("ZOACFBBU").then((data) => {
  console.log(data)
})
```

### Search Song
> param {query} : sontungmtp
```javascript
ZingMp3.search("sontungmtp").then((data) => {
  console.log(data)
})
```

### Get List MV
> param {id, page, count}
```javascript
ZingMp3.getListMV("IWZ9Z08I", "1", "15").then((data) => {
  console.log(data)
})
```

### Get Category MV
> param {id}
```javascript
ZingMp3.getCategoryMV("IWZ9Z08I").then((data) => {
  console.log(data)
})
```

### Get Video MV
> param {id}
```javascript
ZingMp3.getVideo("ZWEW9WI8").then((data) => {
  console.log(data)
})
```


## My update from the original file
### Search Song All
> param {sontungmtp, 1, 18}
```javascript
ZingMp3.searchAll("sontungmtp","1","18").then((data) => {
  console.log(data)
})
```

### Search Playlist All
> param {sontungmtp, 1, 18}
```javascript
ZingMp3.searchAllPlaylist("sontungmtp","1","18").then((data) => {
  console.log(data)
})
```

### Search MV All
> param {sontungmtp, 1, 18}
```javascript
ZingMp3.searchAllVideo("sontungmtp","1","18").then((data) => {
  console.log(data)
})
```

### Search Suggest
```javascript
ZingMp3.Suggest().then((data) => {
  console.log(data)
})
```