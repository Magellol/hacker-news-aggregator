/* eslint-disable no-console */

const {
  TOP_STORIES_ENDPOINT,
  SINGLE_ITEM_ENDPOINT,
  ERROR_TO_RETRY,
  MAX_NUMBER_OF_TRIES,
} = require('./constants');

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

(() => {
  let retry = 0;

  async function run() {
    try {
      console.log('Getting stories...');
      const topStories = await getTopStories();
      const stories = await Promise.all(topStories.map(getItemById));

      const commentsAsPromised = sortStoriesByHighestScore(stories).map(story => (
        getCommentsAndTheirKidsFromIds(story.kids)
      ));

      const listOfAllComments = await Promise.all(commentsAsPromised);

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
      if (error.name === ERROR_TO_RETRY && retry < MAX_NUMBER_OF_TRIES) {
        retry += 1;

        console.log(`Hmm. Looks like the API didn't want us to get results back. We're gonna retry in one second. (${retry} out of ${MAX_NUMBER_OF_TRIES}).`);
        return setTimeout(run, 1500);
      }

      console.error('Looks like something went wrong while aggregating the data. Maybe a human will be able to do something about it.');
      console.error(error);
    }
  }

  run();
})();
