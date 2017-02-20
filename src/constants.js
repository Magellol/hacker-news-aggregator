const host = 'https://hacker-news.firebaseio.com/v0';

module.exports = {
  TOP_STORIES_ENDPOINT: `${host}/topstories.json`,
  SINGLE_ITEM_ENDPOINT: `${host}/item`,
  ERROR_TO_RETRY: 'FetchError',
  MAX_NUMBER_OF_TRIES: 3,
};
