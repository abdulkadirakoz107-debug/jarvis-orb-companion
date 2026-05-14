// Open-Meteo (anahtar gerektirmez) ile gerçek hava durumu.

const WEATHER_CODE: Record<number, string> = {
  0: "açık ☀️",
  1: "az bulutlu 🌤️",
  2: "parçalı bulutlu ⛅",
  3: "kapalı ☁️",
  45: "sisli 🌫️",
  48: "kırağılı sis 🌫️",
  51: "hafif çiseleme 🌦️",
  53: "çiseleme 🌦️",
  55: "yoğun çiseleme 🌦️",
  61: "hafif yağmur 🌧️",
  63: "yağmur 🌧️",
  65: "şiddetli yağmur 🌧️",
  71: "hafif kar 🌨️",
  73: "kar 🌨️",
  75: "yoğun kar ❄️",
  80: "sağanak 🌧️",
  81: "kuvvetli sağanak 🌧️",
  82: "şiddetli sağanak ⛈️",
  95: "gök gürültülü ⛈️",
  96: "dolu ile fırtına ⛈️",
  99: "şiddetli fırtına ⛈️",
};

export async function getWeather(city: string): Promise<string> {
  const q = encodeURIComponent(city);
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=tr&format=json`,
  );
  if (!geoRes.ok) throw new Error("Konum bulunamadı");
  const geo = await geoRes.json();
  const place = geo.results?.[0];
  if (!place) throw new Error(`"${city}" için konum bulunamadı`);

  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
  );
  if (!wxRes.ok) throw new Error("Hava durumu alınamadı");
  const wx = await wxRes.json();
  const c = wx.current;
  const cond = WEATHER_CODE[c.weather_code] ?? "değişken";
  const name = `${place.name}${place.country ? ", " + place.country : ""}`;
  return `🌍 ${name}: ${c.temperature_2m}°C, ${cond} • Nem %${c.relative_humidity_2m} • Rüzgâr ${c.wind_speed_10m} km/s`;
}
