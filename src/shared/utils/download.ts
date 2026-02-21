export function downloadBytes(input: {
  filename: string;
  bytes: Uint8Array;
  mimeType: string;
}): void {
  const copy = new Uint8Array(input.bytes);
  const view = new DataView(copy.buffer as ArrayBuffer);
  const blob = new Blob([view], { type: input.mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = input.filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
