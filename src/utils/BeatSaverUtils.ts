import fetch from './fetch';

interface BeatMap {
  id: string;
  name: string;
  uploader: object;
  description: string;
  metadata: object;
  hash: string;
  automapper: boolean;
  stats: object;
}

interface Playlist {
  playlistTitle: string;
  playlistAuthor: string;
  image: string;
  customData: object;
  songs: object;
}

class BeatSaverUtils {
  getBeatMaps(ids: string): Promise<Record<string, BeatMap>> {
    const chunkSize = 50;
    const chunks: Array<string[]> = [];

    // Split the IDs into chunks of 50
    const idArray = Array.isArray(ids) ? ids : ids.split(',');

    for (let i = 0; i < idArray.length; i += chunkSize) {
      chunks.push([...idArray.slice(i, i + chunkSize)]);
    }

    // Make multiple requests and store the promises
    const promises = chunks.map(
      (chunk, index) =>
        new Promise<Record<string, BeatMap>>((resolve) => {
          setTimeout(() => {
            resolve(
              fetch(`https://api.beatsaver.com/maps/ids/${chunk.join(',')}`),
            );
          }, index * 500); // Wait 500ms after each call
        }),
    );

    // Wait for all promises to resolve
    return Promise.all(promises).then((responses) => {
      // Merge the responses into a single object
      const mergedResponse: Record<string, BeatMap> = {};

      responses.forEach((res) => {
        Object.assign(mergedResponse, JSON.parse(res.response as string));
      });

      return mergedResponse;
    });
  }

  getPlaylist(url: string): Promise<Playlist> {
    return fetch(url).then((response) => JSON.parse(response.response));
  }
}

export default BeatSaverUtils;
