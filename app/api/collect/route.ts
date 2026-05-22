import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as cheerio from "cheerio";

type WeatherValues = {
  temperature: number;
  wind_speed: number;
  precipitation: number;
};

function getHourlyDatetime() {
  const now = new Date();
  const hourlyDatetime = new Date(now);
  hourlyDatetime.setMinutes(0, 0, 0);
  return hourlyDatetime;
}

function extractLatestObservation(bodyText: string): WeatherValues {
  const normalizedText = bodyText.replace(/\s+/g, " ");

  /**
   * Weathernewsの船橋市ページには、観測値の表があり、
   * 「時刻 | 気温(℃) | 風速(m/s) | 風向 | 降水量(mm/h) | 日照(分)」
   * のような並びで表示される。
   *
   * 例：
   * 11時 | 27.7 | 2 | 北北東 | 0 | 60
   */
  const rowPattern =
    /(\d{1,2})時\s+(-?\d+(?:\.\d+)?)\s+([0-9.-]+)\s+([^\s]+)\s+([0-9.]+)\s+([0-9.]+)/;

  const match = normalizedText.match(rowPattern);

  if (!match) {
    throw new Error(
      "Weathernewsの表から1時間ごとの気温・風速・降水量を抽出できませんでした。"
    );
  }

  const temperature = Number(match[2]);
  const wind_speed = match[3] === "-" ? 0 : Number(match[3]);
  const precipitation = Number(match[5]);

  if (
    Number.isNaN(temperature) ||
    Number.isNaN(wind_speed) ||
    Number.isNaN(precipitation)
  ) {
    throw new Error("抽出した天気データを数値に変換できませんでした。");
  }

  return {
    temperature,
    wind_speed,
    precipitation,
  };
}

async function fetchWeatherFromWeathernews(): Promise<WeatherValues> {
  const url = "https://weathernews.jp/onebox/35.724157/139.962623/";

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Weathernewsの取得に失敗しました: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const bodyText = $("body").text();

  return extractLatestObservation(bodyText);
}

export async function GET() {
  try {
    const hourlyDatetime = getHourlyDatetime();
    const weather = await fetchWeatherFromWeathernews();

    const record = {
      datetime: hourlyDatetime.toISOString(),
      area: "千葉県船橋市",
      temperature: weather.temperature,
      wind_speed: weather.wind_speed,
      precipitation: weather.precipitation,
    };

    const { data, error } = await supabase
      .from("weather_records")
      .upsert(record, {
        onConflict: "datetime,area",
      })
      .select();

    if (error) {
      return NextResponse.json(
        {
          message: "保存に失敗しました",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Weathernewsから取得して保存しました",
      source: "https://weathernews.jp/onebox/35.724157/139.962623/",
      record,
      data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";

    return NextResponse.json(
      {
        message: "Weathernews取得処理でエラーが発生しました",
        error: message,
      },
      { status: 500 }
    );
  }
}