const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const odbc = require('odbc');
const app = express();

// Database connection
const connectionString = 'Driver={Microsoft Access Driver (*.mdb, *.accdb)};Dbq=./database/database.accdb;';
let db;

(async () => {
    try {
        db = await odbc.connect(connectionString);
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
})();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API to add a book
app.post('/api/books', async (req, res) => {
    const { author, book, isbn, shelf } = req.body;

    const escapedAuthor = author.replace(/'/g, "''");
    const escapedBook = book.replace(/'/g, "''");
    const escapedIsbn = isbn.replace(/'/g, "''");
    const escapedShelf = shelf.replace(/'/g, "''");

    const query = `INSERT INTO Books (Author, BookName, ISBN, ShelfNumber) 
                   VALUES ('${escapedAuthor}', '${escapedBook}', '${escapedIsbn}', '${escapedShelf}')`;

    try {
        await db.query(query);
        res.status(200).send({ message: 'Book added successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error adding book' });
    }
});

// API to search books
app.get('/api/books', async (req, res) => {
    const search = req.query.search ? req.query.search.replace(/'/g, "''") : '';
    const query = `SELECT * FROM Books WHERE BookName LIKE '%${search}%' OR ISBN LIKE '%${search}%'`;

    try {
        const rows = await db.query(query);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).send({ message: 'Error fetching books' });
    }
});

// API to delete a book by ISBN
app.delete('/api/books/:isbn', async (req, res) => {
  const isbn = req.params.isbn.replace(/'/g, "''"); // Escape single quotes to prevent SQL injection
  const query = `DELETE FROM Books WHERE ISBN = '${isbn}'`;

  try {
      const result = await db.query(query);
      
      if (result.count === 0) {
          // If no rows were affected, ISBN does not exist
          console.error(`No book found with ISBN: ${isbn}`);
          return res.status(404).send({ message: 'Book not found' });
      }

      console.log(`Book with ISBN ${isbn} deleted successfully`);
      res.status(200).send({ message: 'Book deleted successfully' });
  } catch (error) {
      console.error('Error deleting book:', error);
      res.status(500).send({ message: 'Error deleting book', error: error.message });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
