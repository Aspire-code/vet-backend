const { sql, poolPromise } = require('../config/db');

const getAllReviews = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Reviews');
    return result.recordset;
};

const createReview = async (review: { review_id: any; vet_id: any; client_id: any; rating: any; comment: any; }) => {
    const pool = await poolPromise;
    const { review_id, vet_id, client_id, rating, comment } = review;
    await pool.request()
        .input('review_id', sql.VarChar(100), review_id)
        .input('vet_id', sql.VarChar(100), vet_id)
        .input('client_id', sql.VarChar(100), client_id)
        .input('rating', sql.Int, rating)
        .input('comment', sql.Text, comment)
        .query(`INSERT INTO Reviews (review_id, vet_id, client_id, rating, comment)
                VALUES (@review_id, @vet_id, @client_id, @rating, @comment)`);
};

module.exports = { getAllReviews, createReview };
