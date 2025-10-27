export async function pinJSONToIPFS(json: unknown, jwtOrApiKey: string): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: jwtOrApiKey.startsWith("eyJ") ? `Bearer ${jwtOrApiKey}` : jwtOrApiKey,
    },
    body: JSON.stringify({ pinataContent: json }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pinJSONToIPFS failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const cid = data.IpfsHash || data.Hash || data.cid;
  if (!cid) throw new Error("Pinata response missing CID");
  return `ipfs://${cid}`;
}

export async function pinFileToIPFS(file: File, jwtOrApiKey: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: jwtOrApiKey.startsWith("eyJ") ? `Bearer ${jwtOrApiKey}` : jwtOrApiKey,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pinFileToIPFS failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  const cid = data.IpfsHash || data.Hash || data.cid;
  if (!cid) throw new Error("Pinata response missing CID");
  return `ipfs://${cid}`;
}



