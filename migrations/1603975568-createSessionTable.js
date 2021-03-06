exports.up = async (sql) => {
  await sql`CREATE TABLE IF NOT EXISTS sessions (
		session_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
		token VARCHAR(32),
		expiry_timestamp TIMESTAMP NOT NULL DEFAULT NOW()+ INTERVAL '24 hours',
		user_id INTEGER NOT NULL REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE);`;
};

exports.down = async (sql) => {
  await sql`DROP TABLE IF EXISTS sessions;`;
};
