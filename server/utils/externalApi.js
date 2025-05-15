const apiCall = async (url, method, body) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`);
  }

  return response.json();
};

module.exports = {
  apiCall,
};
