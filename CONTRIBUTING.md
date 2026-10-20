# Contributing

Thanks for thinking about helping out. Souvenir is a small project, and small changes are very welcome.

## Getting set up

Clone the repo, run `npm install`, and load the folder as an unpacked extension at `chrome://extensions`. There's no build step, so edit, then reload the extension and the page you're testing on.

## Opening a pull request

Run `npm run check` first. It runs ESLint, Prettier and the tests, and CI runs the same thing. `npm run format` will tidy up formatting for you.

A few things that make a pull request easy to review:

- Keep it to one idea.
- Add a test if the change doesn't touch the page, like formatting, search or storage.
- For anything big, open an issue first so we can talk it through before you spend the time.

## Reporting a bug

It helps to know the page it happened on (a link if you can), which capture method was in use (it's in Settings in the collection), your browser and version, and what you expected to happen. A screenshot of what you got is the most useful thing you can add.

Questions and ideas are welcome too.
