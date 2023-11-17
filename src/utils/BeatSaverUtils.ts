import fetch from './fetch';

class BeatSaverUtils {
  getBeatMaps(ids: string): Promise<object> {
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
        new Promise((resolve) => {
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
      const mergedResponse: object = {};

      responses.forEach((res) => {
        Object.assign(mergedResponse, JSON.parse(res.response as string));
      });

      return mergedResponse;
    });
  }

  getPlaylist(url: string): Promise<object> {
    return fetch(url).then((response) => JSON.parse(response.response));
  }
}

export default BeatSaverUtils;
