# Hacker News Aggregator
Aggregates the top 30 stories on HackerNews and prints out the top 10 commenters across these stories.

## Installation
If you wish to run it on your local machine, please follow the steps below:

1. `git clone git@github.com:Magellol/hacker-news-aggregator.git`
2. `cd hacker-news-aggregator`
3. `yarn` — Or `npm i` if you don't use `yarn`
4. `yarn run aggregate` — Or `npm run aggregate`

**Make sure you're using at least node ^7.0.0. This scripts uses feature that may not be available in earlier versions.**

## Disclaimer
This was an attempt to use the `v0` version of the Hacker News API. As they state on their [github repository](https://github.com/HackerNews/API#design), they've took a dump in-memory of their data structure and put it up on Firebase, which isn't really optimized over the network. Some of the data we want to have require doing _a lot_ of network requests to get them. Without any caching system, this script can sometimes take a little long to complete.

## Output
![Terminal Output](https://cl.ly/1X2i3N100F0n)

![Terminal Output](https://cl.ly/2K0g2a1D3L2L)

## Improvements

- Caching
- Use their [Algolia API](https://hn.algolia.com/api) instead of Firebase (They seem to have proper REST endpoints there).
- Re-try behaviour for network requests. Firebase can sometime give a weird response.

## License
MIT
