const { getPool } = require('../db/mysql');

exports.dbHealth = async (req, res) => {
  const result = {
    mysql: { ok: false, error: null, database: process.env.MYSQL_DATABASE },
    counts: { mysql: {} },
  };

  // Check MySQL
  try {
    const pool = await getPool();
    const [[usersCnt]] = await pool.query('SELECT COUNT(*) as c FROM app_users');
    const [[assetsCnt]] = await pool.query('SELECT COUNT(*) as c FROM assets');
    const [[imgCnt]] = await pool.query('SELECT COUNT(*) as c FROM image_assets');
    const [[vidCnt]] = await pool.query('SELECT COUNT(*) as c FROM video_assets');
    const [[projectsCnt]] = await pool.query('SELECT COUNT(*) as c FROM projects');
    result.mysql.ok = true;
    result.counts.mysql = {
      app_users: usersCnt.c,
      projects: projectsCnt.c,
      assets: assetsCnt.c,
      image_assets: imgCnt.c,
      video_assets: vidCnt.c,
    };
  } catch (err) {
    result.mysql.error = err.message;
  }

  res.json({ success: true, data: result });
};
