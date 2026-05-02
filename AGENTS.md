# AGENTS.md - makasete-zaitaku/app

This directory is the canonical production application for マカセテ在宅.

## Repository Role

- Local path: `/Users/takuyakatou/clawd/projects/makasete-zaitaku/app`
- GitHub remote: `https://github.com/cyakkunnlove/makasete-zaitaku-mock.git`
- Vercel project: `makasete-zaitaku-mock`
- This is the only normal push target for production app work.

## Before Making Changes

1. Confirm you are in this directory, not `../mock` or `tanaka-bot/cognito-vercel-demo`.
2. Run `npm run repo:check` if there is any doubt.
3. Treat `/Users/takuyakatou/clawd/projects/makasete-zaitaku/mock` as an archived HTML prototype.
4. Treat `/Users/takuyakatou/clawd/projects/tanaka-bot/cognito-vercel-demo` as a reference demo only.
5. Treat `/Users/takuyakatou/clawd/projects/tanaka-bot` as local planning/documentation workspace, not production source.

## Push Rule

Only push from this repo after:

```bash
git status --short --branch
npm run lint
npm run build
git push origin main
```

Do not push from `../mock`. It shares the same GitHub remote but is not the production source.
