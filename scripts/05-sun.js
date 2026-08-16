/* ══════════════ 실제 태양 위치 (NOAA Solar Position Algorithm) ══════════════
   지금까지 조명은 눈대중 상수(SUN_AZIMUTH = 240°)였다. 이 모듈은 날짜·시각·좌표로
   실제 태양의 방위각과 고도를 계산해 지형 음영과 하늘색을 구동한다.

   · 정확도: 방위·고도 약 ±0.5° 이내 (NOAA 근사식, 대기 굴절 보정 포함)
   · 시간대: 예루살렘은 UTC+2 (겨울) / UTC+3 (서머타임). 고대에는 시간대 개념이
     없으므로 이 모듈은 '진태양시(local solar time)' 기준을 기본으로 쓴다.
     즉 '정오'는 시계상 12시가 아니라 태양이 가장 높은 순간이다 — 성경의 '제육시'가
     바로 이 진태양시 정오다.
   · 외부 라이브러리 없음(SunCalc 등 불필요). 브라우저 내장 Date만 사용한다.
============================================================================= */
(function (global) {
  'use strict';

  const RAD = Math.PI / 180;
  const DEG = 180 / Math.PI;

  /* 율리우스일 — 1세기 날짜도 그레고리력 확장으로 일관되게 다룬다 */
  function toJulian(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  /* NOAA 근사: 태양의 적경·적위와 균시차 */
  function solarCoords(jd) {
    const t = (jd - 2451545) / 36525;                       // 율리우스 세기
    const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    const M = 357.52911 + t * (35999.05029 - 0.0001537 * t); // 평균 근점이각
    const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    const Mr = M * RAD;
    const C = Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
              Math.sin(2 * Mr) * (0.019993 - 0.000101 * t) +
              Math.sin(3 * Mr) * 0.000289;
    const trueLong = L0 + C;
    const omega = 125.04 - 1934.136 * t;
    const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(appLong * RAD)) * DEG;

    // 균시차(분) — 진태양시와 평균태양시의 차
    const y = Math.tan(eps / 2 * RAD) ** 2;
    const L0r = L0 * RAD;
    const eqTime = 4 * DEG * (
      y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr) +
      4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r) -
      0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr)
    );
    return { decl, eqTime };
  }

  /* 대기 굴절 보정 — 지평선 근처에서 태양이 실제보다 높이 보이는 효과 */
  function refraction(hDeg) {
    if (hDeg > 85) return 0;
    const t = Math.tan(hDeg * RAD);
    if (hDeg > 5) return (58.1 / t - 0.07 / t ** 3 + 0.000086 / t ** 5) / 3600;
    if (hDeg > -0.575) return (1735 + hDeg * (-518.2 + hDeg * (103.4 + hDeg * (-12.79 + hDeg * 0.711)))) / 3600;
    return -20.772 / t / 3600;
  }

  /**
   * 태양 위치 계산
   * @param {Date} date  UTC 기준 시각
   * @param {number} lat 위도(°)
   * @param {number} lng 경도(°)
   * @returns {{azimuth:number, altitude:number, declination:number}}
   *          azimuth: 북=0°, 동=90°, 남=180°, 서=270°
   *          altitude: 지평선 위 고도(°) — 음수면 일몰 이후
   */
  function position(date, lat, lng) {
    const jd = toJulian(date);
    const { decl, eqTime } = solarCoords(jd);
    const minutesUTC = (jd + 0.5 - Math.floor(jd + 0.5)) * 1440;
    // 진태양시(분) → 시간각
    const trueSolarMin = (minutesUTC + eqTime + 4 * lng + 1440) % 1440;
    const hourAngle = trueSolarMin / 4 - 180;

    const latR = lat * RAD, declR = decl * RAD, haR = hourAngle * RAD;
    const cosZenith = Math.sin(latR) * Math.sin(declR) +
                      Math.cos(latR) * Math.cos(declR) * Math.cos(haR);
    const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith))) * DEG;
    let altitude = 90 - zenith;
    altitude += refraction(altitude);

    const denom = Math.cos(latR) * Math.sin(zenith * RAD);
    let azimuth;
    if (Math.abs(denom) < 1e-9) {
      azimuth = lat > 0 ? 180 : 0;
    } else {
      let a = (Math.sin(latR) * Math.cos(zenith * RAD) - Math.sin(declR)) / denom;
      a = Math.acos(Math.min(1, Math.max(-1, a))) * DEG;
      // NOAA: 오전(시간각<0)은 동쪽, 오후(시간각>0)는 서쪽
      azimuth = 180 - a;
      if (hourAngle > 0) azimuth = -azimuth;
      azimuth = (azimuth + 360) % 360;
    }
    return { azimuth, altitude, declination: decl };
  }

  /**
   * 그 지점의 '진태양시 정오'(태양 남중) 시각을 UTC Date 로 돌려준다.
   * 성경의 '제육시'(정오)를 시계 시각이 아니라 태양 기준으로 재현하기 위한 함수.
   */
  function solarNoon(dateUTC, lng) {
    const base = new Date(Date.UTC(dateUTC.getUTCFullYear(), dateUTC.getUTCMonth(), dateUTC.getUTCDate(), 12, 0, 0));
    const { eqTime } = solarCoords(toJulian(base));
    return new Date(base.getTime() - (4 * lng + eqTime) * 60000);
  }

  /**
   * 유대력 시간 표기 → 그날의 UTC 시각.
   * 유대식 '제N시'는 일출을 제1시로 세는 낮 시간(12등분)이다. 제육시 ≈ 정오.
   */
  function jewishHour(dateUTC, lat, lng, hour) {
    const noon = solarNoon(dateUTC, lng);
    // 반일주호(일출~정오 길이)를 계산해 낮을 12등분한다
    const { declination } = position(noon, lat, lng);
    const cosH = -Math.tan(lat * RAD) * Math.tan(declination * RAD);
    const halfDayMin = Math.acos(Math.min(1, Math.max(-1, cosH))) * DEG * 4; // 분
    const sunrise = new Date(noon.getTime() - halfDayMin * 60000);
    const dayHourMs = (halfDayMin * 2 * 60000) / 12;
    return new Date(sunrise.getTime() + (hour - 0.5) * dayHourMs);
  }

  global.BibleAtlasSun = { position, solarNoon, jewishHour, toJulian };
})(window);
