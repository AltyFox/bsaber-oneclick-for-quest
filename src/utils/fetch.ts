function fetch<T = string | Blob | ArrayBuffer | Document | object>(
  url: string,
  options?: object,
  progress?: (resp: VMScriptResponseObject<T>) => void,
): Promise<object | Blob> {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: options?.method || 'GET',
      url,
      headers: options?.headers || {},
      data: options?.body || null,
      responseType: options?.responseType || 'text',
      onload: (response) => {
        resolve(response);
      },
      onprogress: progress,
      onerror: (error) => {
        reject(error);
      },
    });
  });
}

export default fetch;
