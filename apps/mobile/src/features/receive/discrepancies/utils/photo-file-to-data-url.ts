export async function photoFileToDataUrl(path: string): Promise<string> {
  const response = await fetch(path.startsWith('file://') ? path : `file://${path}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read captured photo.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
