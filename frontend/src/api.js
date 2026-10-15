async function request(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Unable to reach Gatherly. Check your connection and try again.");
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    const error = new Error(data.error || "The request could not be completed.");
    error.status = response.status;
    error.retryAfterSeconds = data.retryAfterSeconds;
    throw error;
  }

  return data;
}

export function api(path, options = {}) {
  return request(`/api${path}`, options);
}

export function workspaceApi(options = {}) {
  const { path = "", searchParams, ...requestOptions } = options;
  const query = searchParams ? `?${new URLSearchParams(searchParams)}` : "";
  return request(`/workspace${path}${query}`, requestOptions);
}
