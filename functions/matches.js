export async function onRequest(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  let playerLogo = "";
  let playerLogoyer = "";
  let playerSite = "";
  let reklamVideo = "";
  let reklamSure = 0;
  let reklamDurum = 0;
  let playerPoster = "";

  try {
    const res2 = await fetch("https://panelsahatv.corepanel.pro/api/verirepo.php");
    const json = await res2.json();

    if (json.playerlogo) {
      if (json.playerlogo.player_logo) {
        playerLogo = json.playerlogo.player_logo;
      }
      if (json.playerlogo.player_logoyeriki) {
        playerLogoyer = json.playerlogo.player_logoyeriki;
      }
      if (json.playerlogo.player_site) {
        playerSite = json.playerlogo.player_site;
      }
      if (json.playerlogo.player_reklamvideo) {
        reklamVideo = json.playerlogo.player_reklamvideo;
      }
      if (json.playerlogo.player_reklamsure) {
        reklamSure = parseInt(json.playerlogo.player_reklamsure);
      }
      if (json.playerlogo.player_reklamdurum) {
        reklamDurum = parseInt(json.playerlogo.player_reklamdurum);
      }
      if (json.playerlogo.player_arkaplan) {
        playerPoster = json.playerlogo.player_arkaplan;
      }
    }
  } catch (e) {
    console.error("Veriler alınamadı:", e);
  }

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { margin: 0; padding: 0; background: #000; }
      #player { width: 100%; height: 100vh; position: relative; }

      #ad-timer, #skip-btn {
        position: absolute;
        right: 10px;
        background: rgba(0,0,0,0.75);
        color: #fff;
        padding: 8px 12px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 9999;
      }

      #ad-timer {
        bottom: 40px;
      }

      #skip-btn {
        bottom: 10px;
        display: none;
        cursor: pointer;
        background: #d33;
      }
    </style>
<script src="https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
<script src="/assets/js/clappr.js"></script>
</head>
  <body>
    <div id="player">
      <div id="ad-timer" style="display: none;"></div>
      <div id="skip-btn" onclick="skipAd()">Reklamı Atla</div>
    </div>
<script>
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

// Backend’den reklam bilgileri
const reklamVideo = ""; // Örn: "https://example.com/ad.m3u8"
const reklamSure = 10;   // saniye
const reklamDurum = 1;   // 1 aktif, 0 kapalı

let adPlayer = null;
let countdown = null;

// -------------------
// Reklamı oynat ve ardından main player
// -------------------
function skipAd() {
  if (adPlayer) adPlayer.destroy();
  clearInterval(countdown);
  document.getElementById("ad-timer").style.display = "none";
  document.getElementById("skip-btn").style.display = "none";
  startMainPlayer();
}

function startAdThenMain(mainUrl) {
  if (reklamDurum === 1 && reklamVideo && reklamSure > 0) {
    adPlayer = new Clappr.Player({
      source: reklamVideo,
      parentId: "#player",
      autoPlay: true,
      width: "100%",
      height: "100%"
    });

    const timerDiv = document.getElementById("ad-timer");
    const skipBtn = document.getElementById("skip-btn");
    let remaining = reklamSure;
    timerDiv.style.display = "block";
    timerDiv.innerText = "Reklamın bitmesine kalan süre: " + remaining + " saniye";

    countdown = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(countdown);
        adPlayer.destroy();
        timerDiv.style.display = "none";
        skipBtn.style.display = "none";
        startMainPlayer(mainUrl);
      } else {
        timerDiv.innerText = "Reklamın bitmesine kalan süre: " + remaining + " saniye";
        if (remaining <= reklamSure - 5) skipBtn.style.display = "block";
      }
    }, 1000);
  } else {
    startMainPlayer(mainUrl);
  }
}

// -------------------
// Main player
// -------------------
function startMainPlayer(streamUrl = null) {
  if (!id) {
    document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:20px'>ID eksik</h2>";
    return;
  }

  if (streamUrl) {
    // Direkt stream URL varsa
    new Clappr.Player({
      source: streamUrl,
      parentId: "#player",
      autoPlay: true,
      width: "100%",
      height: "100%",
      mimeType: "application/x-mpegURL"
    });
  } else {
    // Cinema API fetch
    const requestData = {
      AppId: "5000",
      AppVer: "1",
      VpcVer: "1.0.12",
      Language: "en",
      Token: "",
      VideoId: id
    };

    fetch("https://streamsport365.com/cinema", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "*/*" },
      body: JSON.stringify(requestData)
    })
    .then(res => res.json())
    .then(result => {
      if (result.URL) {
        new Clappr.Player({
          source: result.URL,
          parentId: "#player",
          autoPlay: true,
          width: "100%",
          height: "100%",
          mimeType: "application/x-mpegURL"
        });
      } else {
        document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:20px'>Yayın bulunamadı</h2>";
      }
    })
    .catch(err => {
      console.error("Yayın hatası:", err);
      document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:20px'>Yayın hatası</h2>";
    });
  }
}

// -------------------
// Sayfa yüklendiğinde reklam ve main player
// -------------------
document.addEventListener("DOMContentLoaded", () => {
  // Eğer analytics veya önceden link varsa onu kullan
  fetch("https://analyticsjs.sbs/load/yayinlink.php?id=" + encodeURIComponent(id))
    .then(res => res.json())
    .then(data => {
      const streamUrl = data.deismackanal || null;
      startAdThenMain(streamUrl);
    })
    .catch(() => {
      // Analytics yoksa direkt Cinema API
      startAdThenMain(null);
    });
});
</script>
  </body>
</html>
`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
}
