import pool from '../../config/db.js';

// Get all tests (optionally filter by category)
export const getTests = async (req, res, next) => {
  try {
    const { category_id } = req.query;
    let query = `SELECT t.*, c.category_name, c.category_icon
                 FROM tests t
                 LEFT JOIN test_categories c ON t.category_id = c.category_id`;
    let params = [];
    if (category_id) {
      query += ' WHERE t.category_id = $1';
      params.push(category_id);
    }
    const tests = await pool.query(query, params);
    res.json(tests.rows);
  } catch (err) {
    next(err);
  }
};

// Get test by test_code
export const getTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await pool.query(
      `SELECT t.*, c.category_name, c.category_icon
       FROM tests t
       LEFT JOIN test_categories c ON t.category_id = c.category_id
       WHERE t.test_code = $1`,
      [id]
    );
    if (test.rows.length === 0) return res.status(404).json({ message: 'Test not found' });
    res.json(test.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Get all test categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await pool.query('SELECT * FROM test_categories');
    res.json(categories.rows);
  } catch (err) {
    next(err);
  }
};

// Search tests by name or description
export const searchTests = async (req, res, next) => {
  try {
    const { q } = req.query;
    const tests = await pool.query(
      `SELECT t.*, c.category_name, c.category_icon
       FROM tests t
       LEFT JOIN test_categories c ON t.category_id = c.category_id
       WHERE t.test_name ILIKE $1 OR t.test_description ILIKE $1`,
      [`%${q}%`]
    );
    res.json(tests.rows);
  } catch (err) {
    next(err);
  }
};
