# Mascot assets

Official WebP mascot artwork lives at:

```
/icons/{mascot-id}/{pose}.webp
```

Example: `/icons/bella-bunny/welcome.webp`

## Mascot folders

- `bella-bunny`
- `gigi-giraffe`
- `poppy-panda`
- `eli-elephant`
- `penny-penguin`
- `benny-bear`

Legacy CMS id `freddy-ferret` resolves to `benny-bear` at runtime (no database change).

## Pose fallback

If a pose file is missing, the UI tries `default.webp`, then `default.png`, then `default.svg`. If none exist, the mascot is hidden (no emoji placeholders).

## Standard poses

`default`, `default-standing`, `welcome`, `wave`, `peek`, `reading`, `hug`, `sleeping`, `studying`, `celebration`, `hold-heart`, `hold-product`
