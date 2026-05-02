# マカセテ在宅 mock デプロイ運用

最終更新: 2026-05-02

## 基本方針

- GitHub repository `cyakkunnlove/makasete-zaitaku-mock` の `main` ブランチを正本とする。
- Vercel production は `main` への push を起点に自動反映する。
- Vercel CLI からの直接 production deploy は、緊急確認や一時検証に限定する。
- 直接 deploy した変更は、安定確認後に必ず GitHub へ戻す。

## 現在の接続先

- GitHub: https://github.com/cyakkunnlove/makasete-zaitaku-mock
- Vercel project: `makasete-zaitaku-mock`
- Production URL: https://makasete-zaitaku-mock.vercel.app
- Production branch: `main`

## 通常フロー

1. ローカルで変更する。
2. `npm run build` を通す。
3. `main` へ commit / push する。
4. Vercel の production deployment が `Ready` になることを確認する。
5. 必要に応じて production URL で主要画面を確認する。

## 緊急時フロー

一時的に Vercel CLI で直接 deploy した場合は、次を必須にする。

1. 直接 deploy した URL と内容を記録する。
2. production URL で安定確認する。
3. 同じ変更を GitHub repository に反映する。
4. `main` push による GitHub 起点の deployment を再度通す。
5. 以後の基準を GitHub の commit に戻す。

## 確認コマンド

```bash
npm ci
npm run build
vercel project inspect makasete-zaitaku-mock
vercel ls makasete-zaitaku-mock
```

## 注意

- `.env.local` は commit しない。
- 本番環境の秘密情報は Vercel Environment Variables に設定する。
- `tanaka-bot` 側の設計メモや bot 作業ファイルを、この repository に混ぜない。
