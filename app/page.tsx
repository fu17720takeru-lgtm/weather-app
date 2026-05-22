import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: weatherData, error } = await supabase
    .from("weather_records")
    .select("*")
    .order("datetime", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
          <h1 className="mb-4 text-2xl font-bold">
            Weather Data Dashboard
          </h1>
          <p className="text-red-500">データの取得に失敗しました。</p>
          <pre className="mt-4 whitespace-pre-wrap rounded bg-gray-100 p-4 text-sm">
            {error.message}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow">
        <h1 className="mb-2 text-2xl font-bold">
          Weather Data Dashboard
        </h1>

        <p className="mb-6 text-gray-600">
          Supabaseに保存された気温・風速・降水量を表示します。
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border p-3">日時</th>
                <th className="border p-3">地域</th>
                <th className="border p-3">気温</th>
                <th className="border p-3">風速</th>
                <th className="border p-3">降水量</th>
              </tr>
            </thead>

            <tbody>
              {weatherData?.map((data) => (
                <tr key={data.id}>
                  <td className="border p-3">
                    {new Date(data.datetime).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </td>
                  <td className="border p-3">{data.area}</td>
                  <td className="border p-3">{data.temperature}℃</td>
                  <td className="border p-3">{data.wind_speed} m/s</td>
                  <td className="border p-3">{data.precipitation} mm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {weatherData?.length === 0 && (
          <p className="mt-4 text-gray-500">
            まだデータがありません。
          </p>
        )}
      </div>
    </main>
  );
}