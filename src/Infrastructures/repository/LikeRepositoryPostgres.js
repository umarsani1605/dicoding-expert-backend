import LikeRepository from '../../Domains/likes/LikeRepository.js';

class LikeRepositoryPostgres extends LikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addLike(newLike) {
    const { commentId, owner } = newLike;
    const id = `like-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO comment_likes VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async deleteLike(commentId, owner) {
    const query = {
      text: 'DELETE FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async isLiked(commentId, owner) {
    const query = {
      text: 'SELECT id FROM comment_likes WHERE comment_id = $1 AND owner = $2',
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }

  async getLikeCountsByThreadId(threadId) {
    const query = {
      text: `SELECT comment_likes.comment_id, COUNT(comment_likes.id)::int AS like_count
             FROM comment_likes
             LEFT JOIN comments ON comment_likes.comment_id = comments.id
             WHERE comments.thread_id = $1
             GROUP BY comment_likes.comment_id`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows.map(({ comment_id: commentId, like_count: likeCount }) => ({
      commentId,
      likeCount,
    }));
  }
}

export default LikeRepositoryPostgres;
