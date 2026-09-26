import request from 'supertest';
import pool from '../src/Infrastructures/database/postgres/pool.js';

const ServerTestHelper = {
  async registerAndLogin(app, {
    username = 'dicoding',
    password = 'secret',
    fullname = 'Dicoding Indonesia',
  } = {}) {
    await request(app).post('/users').send({ username, password, fullname });

    const loginResponse = await request(app)
      .post('/authentications')
      .send({ username, password });

    const { rows } = await pool.query({
      text: 'SELECT id FROM users WHERE username = $1',
      values: [username],
    });

    return {
      accessToken: loginResponse.body.data.accessToken,
      userId: rows[0].id,
    };
  },
};

export default ServerTestHelper;
