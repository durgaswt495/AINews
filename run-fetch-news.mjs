import fetchNews from './dist/api/fetch-news.js';

const req = {
  query: {},
  headers: {},
  body: undefined,
  method: 'GET',
};

const res = {
  status(code) {
    this._status = code;
    return this;
  },
  json(data) {
    console.log('Response JSON:', JSON.stringify(data, null, 2));
    // keep process alive briefly to allow async logs to flush
    setTimeout(() => process.exit(0), 200);
  },
  send(data) {
    console.log('Response SEND:', data);
    setTimeout(() => process.exit(0), 200);
  },
};

(async () => {
  try {
    await fetchNews(req, res);
  } catch (err) {
    console.error('Error running fetch-news:', err);
    process.exit(1);
  }
})();
