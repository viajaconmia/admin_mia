export async function uploadHotelImage({
  file,
  url,
  apiKey,
}: {
  file: File;
  url: string;
  apiKey: string;
}): Promise<{ publicUrl: string }> {
  const res = await fetch(
    `${url}/mia/hoteles/carga-imagen?filename=${encodeURIComponent(file.name)}&filetype=${file.type}`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    }
  );

  const { url: uploadUrl, publicUrl } = await res.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadRes.ok) throw new Error("Error al subir imagen");

  return { publicUrl };
}