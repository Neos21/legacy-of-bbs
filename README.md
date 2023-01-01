# Legacy of BBS

- __[Enter The Website](https://legacy-of-bbs.pages.dev/)__


## Init Cloudflare Pages

```bash
$ npm install -g wrangler
$ wrangler -v
 ⛅️ wrangler 2.6.2
# Browser Authentication
$ wrangler login

# Git Clone Then Create `wrangler.toml`
$ wrangler init
$ cat ./wrangler.toml
name = "legacy-of-bbs"
compatibility_date = "2022-12-31"
```

### Create D1 SQLite DB

```bash
$ wrangler d1 create legacy-of-bbs
$ cat << EOL >> ./wrangler.toml
[[ d1_databases ]]
binding = "DB"
database_name = "legacy-of-bbs"
database_id = "eebf425b-5865-429f-960a-9ab1ea6a0c32"
EOL

# Binding D1 Database In Web Console
```

### Setup Database

```bash
# Production DB
$ wrangler d1 execute legacy-of-bbs --command='DROP TABLE IF EXISTS posts'
$ wrangler d1 execute legacy-of-bbs --command='CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, comment TEXT, count INTEGER, rank TEXT)'
# Insert Dummy Posts
$ wrangler d1 execute legacy-of-bbs --command="INSERT INTO posts (name, date, comment, count, rank) VALUES ('Name 1', '2022-12-30 00:01:02', 'Comment 1\nTest', 1, '初心者')"
$ wrangler d1 execute legacy-of-bbs --command="INSERT INTO posts (name, date, comment, count, rank) VALUES ('名前 2', '2022-12-31 01:02:03', 'コメント 2 Test', 1, '初心者')"
# Get Two Posts
$ wrangler d1 execute legacy-of-bbs --command='SELECT * FROM posts ORDER BY id DESC'
# Get Second (Latest) Post
$ wrangler d1 execute legacy-of-bbs --command='SELECT * FROM posts ORDER BY id DESC LIMIT 1 OFFSET 0'
# Get First (Older) Post
$ wrangler d1 execute legacy-of-bbs --command='SELECT * FROM posts ORDER BY id DESC LIMIT 1 OFFSET 1'

# Local DB : `./.wrangler/state/d1/DB.sqlite3`
$ wrangler d1 execute legacy-of-bbs --local --command='DROP TABLE IF EXISTS posts'
$ wrangler d1 execute legacy-of-bbs --local --command='CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, comment TEXT, count INTEGER, rank TEXT)'
$ wrangler d1 execute legacy-of-bbs --local --command="INSERT INTO posts (name, date, comment, count, rank) VALUES ('Name 1', '2022-12-30 00:01:02', 'Comment 1\nTest', 1, '初心者')"
$ wrangler d1 execute legacy-of-bbs --local --command="INSERT INTO posts (name, date, comment, count, rank) VALUES ('名前 2', '2022-12-31 01:02:03', 'コメント 2 Test', 1, '初心者')"
$ wrangler d1 execute legacy-of-bbs --local --command='SELECT * FROM posts ORDER BY id DESC'
# Delete
$ wrangler d1 execute legacy-of-bbs --local --command='DELETE FROM posts'
$ wrangler d1 execute legacy-of-bbs --local --command='DELETE FROM ranks'
```


## Development

```bash
# Local Dev : http://localhost:8788/
$ wrangler pages dev . --local --persist
# Looking For `./.wrangler/state/d1/DB.sqlite3`
```


## Publish

```bash
$ wrangler pages publish ./ --project-name legacy-of-bbs
✨ Successfully created the 'legacy-of-bbs' project.
```


## Cloudflare Pages Functions

- `./functions/api/posts.js` : `export async function onRequestGet(eventContext)` → GET `/api/posts`


## Links

- [Neo's World](https://neos21.net/)
