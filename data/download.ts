import { Platform, Share } from 'react-native';

export type SaveResult = 'downloaded' | 'shared' | 'unavailable';

/** Hands the user a text file: a browser download on web, the share sheet on native. */
export async function saveTextFile(
  filename: string,
  contents: string,
  mime = 'text/csv;charset=utf-8'
): Promise<SaveResult> {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined' || typeof URL === 'undefined') return 'unavailable';
    const url = URL.createObjectURL(new Blob([contents], { type: mime }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Give the browser a beat to start the download before the URL goes away.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  }

  await Share.share({ title: filename, message: contents });
  return 'shared';
}
