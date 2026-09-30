# Home Air — Android havo sifati ilovasi

Uy joylashuviga bog‘langan tashqi havo prognozi va keyinchalik uy sensorlari bilan ishlash uchun React Native / Expo / TypeScript loyihasi. Interfeys o‘zbekcha, to‘liq mobil ekran uchun yaratilgan.

## Hozir ishlaydigan qismlar

- Uy nuqtasini GPS, Android xaritasi yoki koordinatalar bilan belgilash va telefonda saqlash.
- Open-Meteo / CAMS orqali US AQI va EU AQI; PM2.5, PM10, CO, NO₂, O₃, SO₂, chang va UV ko‘rsatkichlari.
- US AQI ning olti ifloslantiruvchi va EU AQI ning besh ifloslantiruvchi uchun alohida indekslari.
- Oxirgi 24 soat model ma’lumotlari va keyingi 24 soat prognozi.
- AirGradient ONE / Open Air lokal API adapteri: PM1, PM2.5, PM10, CO₂, VOC indeksi, NOx indeksi, harorat va namlik. Qurilma qaytarmagan o‘lchov bo‘sh ko‘rsatiladi.
- Ochiq ilovada tashqi havo har 5 daqiqada, sensor har 60 soniyada yangilanadi; qayta ochilganda yangilanadi.
- Timeout, xatolik va eskirgan ma’lumot holatlari; uy nuqtasi o‘zgarganda eski so‘rov natijasi yangi uy ma’lumotiga aralashmaydi.

Bu versiya APK emas, APK yig‘ish konfiguratsiyasiga ega manba loyihadir. Telefon / emulator va haqiqiy sensor bilan sinov hali bajarilmagan.

## Ishga tushirish

Node.js 24 LTS tavsiya etiladi. SDK va paket versiyalari `package-lock.json` bilan saqlangan.

```bash
cd home-air
npm ci --include=dev
npm start
```

SDK 57 bilan mos Expo Go ishlatilsa, terminaldagi QR orqali Android telefonda oching. Expo Go versiyasi mos kelmasa development build yarating. Barcha native modullar ishlashini development build / haqiqiy qurilmada tekshiring.

```bash
npm run web
npm run typecheck
npm run lint
npm test
npm run export:web
npm run export:android
```

`export:android` faqat JavaScript/Hermes bundle yaratadi — o‘rnatiladigan APK emas. Web eksportni SPA fallback bilan xizmat qiladigan statik serverda oching. Web versiyada xarita OSM orqali ko‘rsatiladi, nuqta koordinatalar bilan belgilanadi; Androidda xaritaga bosib yoki markerni surib tanlash mumkin.

## APK yig‘ish

1. Expo hisobingizga `npx eas-cli@latest login` orqali kiring.
2. `npx eas-cli@latest build:configure` bilan o‘zingizga tegishli EAS loyihasini yarating / ulang.
3. Xarita kerak bo‘lsa, Google Cloud’da Maps SDK for Android kaliti yarating. Uni `uz.homeair.app` paketi va build imzolash sertifikatining SHA-1 izi bilan cheklang.
4. `.env.example` dan `.env` yarating va `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` ni kiriting. EAS muhitida shu o‘zgaruvchini sozlang. Native kalit konfiguratsiyada ishlatiladi; o‘zgarganda binary qayta yig‘iladi.
5. `npx eas-cli@latest build --platform android --profile preview` orqali APK oling.

Xarita kaliti bo‘lmasa standalone Androidda xarita yashiriladi; GPS va koordinata orqali belgilash qoladi. `preview` APK, `production` Google Play uchun AAB yaratadi. EAS bulut buildi bu ish davomida ishga tushirilmagan.

## Sensorni keyin ulash

AirGradient ONE / Open Air va lokal API qo‘llaydigan firmware kerak. Sensor va telefonni bir Wi-Fi ga ulang. Qurilmaning IP manzilini routerdan toping.

Ilovadagi **Sensorlar** sahifasiga xona nomi va `http://192.168.1.50` kabi qurilma manzilini kiriting. **Tekshirish va ulash** haqiqiy javob olingandan keyingina saqlaydi. Qurilma manzili misol, sizdagi haqiqiy IP bilan almashtiring.

Lokal API: `GET /measures/current`. Adapter `pm02Compensated`, `atmpCompensated`, `rhumCompensated` mavjud bo‘lsa ulardan foydalanadi. VOC va NOx qiymatlari konsentratsiya yoki foiz sifatida talqin qilinmaydi.

HTTP faqat lokal IP / `.local` manzil uchun qabul qilinadi; telefondagi manzillar tashqi serverga yuborilmaydi. Androidda lokal sensor HTTP uchun cleartext yoqilgan. Uy Wi-Fi qurilmasini internetga port-forward bilan ochish talab qilinmaydi. HTTPS web ko‘rinishidan HTTP sensorga so‘rov mixed-content / CORS / private-network qoidalari bilan to‘silishi mumkin; Android ilovasi uchun bu boshqa muhitdir.

## Raqamlar nimani anglatadi

| Ko‘rsatkich | Birlik | Manba |
| --- | --- | --- |
| US / EU AQI | indeks, foiz emas | Hududiy model |
| PM2.5, PM10, tashqi gazlar | µg/m³ | Hududiy model |
| Uy PM1, PM2.5, PM10 | µg/m³ | Sensor |
| Uy CO₂ | ppm | Sensor |
| VOC / NOx | qurilma indeksi | Sensor |
| Namlik | % | Sensor |
| Harorat | °C | Sensor |

O‘zbekistonda CAMS global modeli taxminan 45 km aniqlikda. Nuqta aniq tanlansa ham hovli yoki xona darajasidagi haqiqiy o‘lchovga aylanmaydi. Tashqi API ma’lumoti, prognoz va sensor o‘lchovi alohida ko‘rsatiladi. Bitta oddiy sensor barcha zararli moddalarning kimyoviy tarkibini o‘lchamaydi; qo‘llab-quvvatlanadigan ko‘rsatkichlar qurilmaga bog‘liq.

Sensorning joriy PM2.5 qiymati avtomatik US AQI ga aylantirilmagan: standartlar turli vaqt bo‘yicha o‘rtachalar talab qiladi. US va EU raqamlarining shkalalari bir xil emas. Ilova kategoriyalarni xizmatdan kelgan indekslarga asoslanib ko‘rsatadi.

## Arxitektura

- `src/app/`: Expo Router ekranlari.
- `src/domain/air.ts`: turlar, birliklar, kategoriyalar, validatsiya va normalizatsiya.
- `src/services/providers.ts`: tashqi API va sensor adapterlari; timeout va HTTP xatolari.
- `src/state/AirContext.tsx`: sozlamalar, so‘rovlar, yangilanish va eski so‘rovni rad etish.
- `src/components/`: UI, grafik va platformaga mos xarita.
- `tests/air.test.ts`: ma’lumotlarning yo‘qligi, vaqt, koordinatalar, indeks shkalalari va sensor formati sinovlari.

Kelajakdagi MQTT / Bluetooth / boshqa brend adapterlari `IndoorProvider` orqali bir xil ko‘rsatkichlar modelini qaytarishi mumkin. Native Bluetooth integratsiyasi uchun development build kerak bo‘ladi. Hozir bitta uy nuqtasi va bitta sensor qo‘llanadi.

## Keyingi bosqichlar

1. Haqiqiy Android va tanlangan sensor bilan ulanish, xarita va uzoq ishlashni tekshirish.
2. Ko‘p xona / sensor, SQLite’da o‘lchovlar tarixi, kalibratsiya ma’lumotlari va CSV eksport.
3. Uy gateway’i orqali MQTT → backend → ilova: tashqaridan kuzatish, sensor holati va vaqt belgilarini tekshirish.
4. Server yoki native fon vazifasi orqali sozlanadigan bildirishnomalar. Hozir ilova yopiq bo‘lsa monitoring va push xabarlari ishlamaydi.
5. Tashqi va ichki sharoitni birga hisobga oladigan shamollatish tavsiyalari; keyin aqlli qurilmalar avtomatizatsiyasi.

## Maxfiylik va ma’lumot manbalari

Hisob ochish va backend hozir talab qilinmaydi. Uy va sensor manzili telefonda saqlanadi. Tashqi prognoz uchun uy koordinatalari Open-Meteo xizmatiga yuboriladi. Web xarita ko‘rsatilganda koordinatalar OpenStreetMap xizmatiga ham yuboriladi. Android Google xaritasi ishlatilsa Google xarita xizmatlari ishlatiladi. Sensor javoblari va model tarixini uzoq muddatli saqlash hozir yo‘q.

Open-Meteo bepul API shaxsiy / notijorat foydalanish uchun; tijorat yoki keng ko‘lamli ishlatishdan oldin joriy tarif va shartlarini tekshiring. Interfeysda Open-Meteo va CAMS manbasi ko‘rsatilgan. Google Maps / EAS xizmatlari shartlari o‘zingizning hisobingizga bog‘liq.

- https://open-meteo.com/en/docs/air-quality-api
- https://open-meteo.com/en/terms
- https://www.airgradient.com/documentation/kb/local-server
- https://github.com/airgradienthq/arduino/blob/master/docs/local-server.md
- https://docs.expo.dev/versions/v57.0.0/sdk/location/
- https://docs.expo.dev/versions/v57.0.0/sdk/map-view/
- https://docs.expo.dev/build/introduction/

## Tekshiruv holati

TypeScript, ESLint va 5 domain testi tekshirilgan. Open-Meteo API so‘rovi Toshkent sinov koordinatasida muvaffaqiyatli ishladi. Web va Android bundle eksporti bajarildi. SDK paketlari uchun `expo install --check` moslikni tasdiqladi. Expo Doctor 21 tekshiruvdan 19 tasini o‘tkazdi; ikki onlayn tekshiruv Expo / React Native Directory tarmoq javobi sabab yakunlanmadi. APK build va haqiqiy apparatdagi sinovlar alohida bajarilishi kerak.

Playwright mobil web ko‘rinishida bo‘sh koordinatalar validatsiyasi va uy nuqtasini saqlash tekshirildi. Test brauzerining tashqi tarmog‘ida sertifikat / DNS cheklovi sabab dashboard tekshiruvida oldin haqiqiy API dan yuklab olingan JSON javob qayta berildi. Ilovaning o‘zida TLS tekshiruvi o‘chirilmagan va sun’iy raqamlar qo‘shilmagan. `output/playwright/dashboard.png` — Toshkent sinov nuqtasining ekran ko‘rinishi; foydalanuvchining haqiqiy uy manzili emas.
