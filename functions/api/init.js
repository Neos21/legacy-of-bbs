/**
 * Get : Initialize Tables
 * 
 * @param {EventContext} context Event Context
 * @return {Promise<Response>} Response
 */
export async function onRequestGet(context) {
  const db = context.env.DB;
  
  await db.prepare('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, comment TEXT, count INTEGER, rank TEXT)').run();
  const postsTotal = await db.prepare('SELECT COUNT(*) AS total FROM posts').first('total');
  if(postsTotal === 0) await db.prepare('INSERT INTO posts (name, date, comment, count, rank) VALUES (\'Name 1\', \'2022-12-30 00:01:02\', \'Comment 1\nTest\', 1, \'初心者\')').run();
  
  await db.prepare('CREATE TABLE IF NOT EXISTS ranks (name TEXT, count INTEGER, rank TEXT)').run();
  const ranksTotal = await db.prepare('SELECT COUNT(*) AS total FROM ranks').first('total');
  if(ranksTotal === 0) await db.prepare('INSERT INTO ranks (name, count, rank) VALUES (\'Name 1\', 1, \'初心者\')').run();
  
  await db.prepare('CREATE TABLE IF NOT EXISTS rank_titles (rank TEXT, count_low INTEGER)').run();
  const rankTitlesTotal = await db.prepare('SELECT COUNT(*) AS total FROM rank_titles').first('total');
  if(rankTitlesTotal === 0) await db.prepare(`INSERT INTO rank_titles (rank, count_low) VALUES
    (\'初心者\'        ,   0),
    (\'一般人\'        ,   5),
    (\'中級者\'        ,  10),
    (\'チョットワカル\',  20),
    (\'チョットデキル\',  30),
    (\'ファン\'        ,  40),
    (\'上級者\'        ,  50),
    (\'オタク\'        ,  60),
    (\'マニア\'        ,  70),
    (\'専門家\'        ,  80),
    (\'博士\'          ,  90),
    (\'マスター\'      , 100)
  `).run();
  
  return new Response('Tables Are Initialized');
}