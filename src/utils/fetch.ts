function fetch(url: string, options?: object): Promise<object> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: options?.method || 'GET',
      url,
      headers: options?.headers || {},
      data: options?.body || null,
      onload: (response) => {
        resolve(response);
      },
      onerror: (error) => {
        reject(error);
      },
    });
  });
}

export default fetch;
