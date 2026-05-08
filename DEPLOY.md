# Deploy notes

These are the bits a fresh VPS needs to run nandishwarsingh.com end-to-end.

## Required services

- Node 22+ (use nvm)
- MongoDB 6+ (`apt install mongodb-org` — runs natively, no docker)
- ffmpeg (`apt install ffmpeg`) — needed for the downloader's audio re-encodes and merging
- yt-dlp — `apt install yt-dlp` or pip3 with auto-update via cron; the API path is `/opt/homebrew/bin/yt-dlp` on macOS dev, override with `YT_DLP_PATH` on Linux

## Environment

`.env` (or systemd `EnvironmentFile=`) on the VPS:

```env
# Mongo
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=nandishwarsingh

# Site
SITE_ORIGIN=https://nandishwarsingh.com
SITE_AUTHOR=Nandishwar Singh

# Admin basic auth (proxy.ts gates /admin and /api/admin)
ADMIN_USER=nandishwar
ADMIN_PASSWORD=change-me

# yt-dlp + ffmpeg paths (Linux)
YT_DLP_PATH=/usr/bin/yt-dlp
```

## Cron entries

Run `crontab -e` as the user owning the app:

```cron
# Keep yt-dlp current — YouTube rotates signing keys often.
0 5 * * * pip3 install --upgrade --user yt-dlp >> /var/log/yt-dlp-update.log 2>&1
```
