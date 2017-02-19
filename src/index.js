/* eslint-disable no-console */

const { TOP_STORIES_ENDPOINT, SINGLE_ITEM_ENDPOINT } = require('./constants');

const {
  fetch,
  flatten,
  generateCliTable,
} = require('./helpers');

/**
 * Get an array of top stories.
 * Pass in a `limit` to specify the number of items you wish to get back.
 * The API cannot return a specific number now, so we're just returning a slice of the list.
 *
 * @param  {Number} [limit=30] Number of results that should be returned.
 * @return {Promise}           Promise resolving in that list.
 */
function getTopStories(limit = 30) {
  return fetch(TOP_STORIES_ENDPOINT)
    .then(topStories => topStories.slice(0, limit));
}

/**
 * Get an item by the given `itemId`.
 *
 * @param  {Number} itemId Item unique id
 * @return {Promise}       Promise resolve in an item object literal.
 */
function getItemById(itemId) {
  return fetch(`${SINGLE_ITEM_ENDPOINT}/${itemId}.json`);
}

/**
 * Recursive async function that gets a list of items and their kids.
 * The result is a Promise resulting in a one dimensional array (everything is flattened).
 *
 * @param  {Array}   [itemIds=[]]  List of item ids to fetch.
 * @param  {Array}   [allItems=[]] Memoized array of already-fetched items.
 * @return {Promise}               Promise resolving in an array of item object literals.
 */
async function getCommentsAndTheirKidsFromIds(itemIds = [], allItems = []) {
  const itemsAsPromised = itemIds.map(getItemById);
  const listOfItems = await Promise.all(itemsAsPromised);

  const kidIds = listOfItems.reduce((items, item) => {
    const kids = item.kids || [];
    return [...items, ...kids];
  }, []);

  if (kidIds.length !== 0) {
    return getCommentsAndTheirKidsFromIds(kidIds, [...allItems, ...listOfItems]);
  }

  return allItems;
}

/**
 * Sorts a list of stories by their score.
 * If the score is the same, we're falling back to alphabetical order.
 *
 * @param  {Array} stories  Array of stories object literals.
 * @return {Array}         Same but sorted array.
 */
function sortStoriesByHighestScore(stories) {
  return stories.sort((storyA, storyB) => {
    if (storyA.score === storyB.score) {
      return storyA.title < storyB.title ? -1 : 1;
    }

    return storyA.score > storyB.score ? -1 : 1;
  });
}

/**
 * Reducer that's taking in a list of all comments happened in stories
 * and will return an array of `[commentName, totalCommentHeDid]`.
 *
 * @param  {Array} listOfAllComments  Array of comment object literals.
 * @return {Array}                    Array of the top ten commenters across all stories.
 */
function getTopTenCommenters(listOfAllComments) {
  const topList = flatten(listOfAllComments)
    .filter(comment => !comment.deleted)
    .reduce((topCommenters, comment) => {
      const author = topCommenters[comment.by];

      return Object.assign({}, topCommenters, {
        [comment.by]: author ? author + 1 : 1,
      });
    }, {});

  return Object.keys(topList)
    .sort((personA, personB) => {
      const {
        [personA]: valueOfA,
        [personB]: valueOfB,
      } = topList;

      if (valueOfA === valueOfB) {
        return personA > personB ? 1 : -1;
      }

      return valueOfA > valueOfB ? -1 : 1;
    })
    .slice(0, 10)
    .map(name => [name, topList[name]]);
}

(async () => {
  const warningId = setTimeout(() => {
    console.log(
      'It\'s slow isn\'t it? Well...part of it is how HackerNews API is designed ' +
      'we have to do a lot of queries to get what we want. And, also myself to not put a cache system.' // eslint-disable-line comma-dangle
    );
  }, 8000);

  try {
    const topStories = await getTopStories();

    console.log('Fetching stories...');
    const stories = await Promise.all(topStories.map(getItemById));

    console.log('Fetching comments for each story...');
    const commentsAsPromised = sortStoriesByHighestScore(stories).map(story => (
      getCommentsAndTheirKidsFromIds(story.kids)
    ));

    const listOfAllComments = await Promise.all(commentsAsPromised);

    clearTimeout(warningId);
    const topTen = getTopTenCommenters(listOfAllComments);

    console.log('\n=================================================');
    console.log('List of the top stories on hacker news right now.');
    console.log('==================================================');
    console.log(generateCliTable(['Story title', 'Score'], stories.map(story => [story.title, story.score])));

    console.log('=================================================================================');
    console.log('List of all top commenters and their total comments across the top stories above.');
    console.log('=================================================================================');
    console.log(generateCliTable(['User name', 'Total comments'], topTen));
  } catch (error) {
    console.error('Looks like something went wrong while aggregating the data. Maybe a human will be able to do something about it.');
    console.error(error);

    // TODO do a re-try behaviour, it happens that HN sends a really bad response...
  }
})();
