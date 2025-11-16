import { db, create_record, execute_query } from './src/config/database.js';

async function seed_database() {
  try {
    console.log('🌱 Starting database seeding...');

    // Wait for database to initialize
    const database = await db();
    console.log('✓ Database connected');

    // Check if data already exists
    const existing_patrons = await database.all('SELECT * FROM PATRONS');
    if (existing_patrons.length > 0) {
      console.log('⚠️  Database already contains data. Clearing and reseeding...');
      
      // IMPORTANT: Temporarily disable foreign key constraints for deletion
      await database.exec('PRAGMA foreign_keys = OFF;');
      
      // Clear existing data
      await database.exec('DELETE FROM FINES');
      await database.exec('DELETE FROM TRANSACTIONS');
      await database.exec('DELETE FROM RESERVATIONS');
      await database.exec('DELETE FROM LIBRARY_ITEM_COPIES');
      await database.exec('DELETE FROM BOOKS');
      await database.exec('DELETE FROM VIDEOS');
      await database.exec('DELETE FROM VINYL_ALBUMS');
      await database.exec('DELETE FROM AUDIOBOOKS');
      await database.exec('DELETE FROM MAGAZINES');
      await database.exec('DELETE FROM CDS');
      await database.exec('DELETE FROM PERIODICALS');
      await database.exec('DELETE FROM LIBRARY_ITEMS');
      await database.exec('DELETE FROM PATRONS');
      await database.exec("DELETE FROM BRANCHES WHERE id != 1");
      
      // Re-enable foreign key constraints
      await database.exec('PRAGMA foreign_keys = ON;');
      
      console.log('✓ Cleared existing data');
    }

    // Create second library branch
    console.log('\n🏢 Creating library branches...');
    const branch2_id = await create_record('BRANCHES', {
      branch_name: 'Downtown Branch',
      address: '789 City Center Plaza, Springfield',
      phone: '555-2000',
      is_main: 0,
    });
    console.log(`✓ Created Downtown Branch (ID: ${branch2_id})`);

    console.log('\n📚 Creating diverse library collection...');

    // Book data with creative real titles
    const books = [
      { title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', pages: 304, year: 2020, publisher: 'Canongate Books' },
      { title: 'Where the Crawdads Sing', author: 'Delia Owens', genre: 'Mystery', pages: 384, year: 2018, publisher: 'G.P. Putnam\'s Sons' },
      { title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Thriller', pages: 336, year: 2019, publisher: 'Celadon Books' },
      { title: 'Educated', author: 'Tara Westover', genre: 'Memoir', pages: 352, year: 2018, publisher: 'Random House' },
      { title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', pages: 400, year: 2018, publisher: 'Little, Brown and Company' },
      { title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', genre: 'Historical Fiction', pages: 400, year: 2017, publisher: 'Atria Books' },
      { title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', pages: 320, year: 2018, publisher: 'Avery' },
      { title: 'The Song of Achilles', author: 'Madeline Miller', genre: 'Fantasy', pages: 378, year: 2011, publisher: 'Ecco' },
      { title: 'Project Hail Mary', author: 'Andy Weir', genre: 'Science Fiction', pages: 496, year: 2021, publisher: 'Ballantine Books' },
      { title: 'The Invisible Life of Addie LaRue', author: 'V.E. Schwab', genre: 'Fantasy', pages: 448, year: 2020, publisher: 'Tor Books' },
      { title: 'Daisy Jones & The Six', author: 'Taylor Jenkins Reid', genre: 'Historical Fiction', pages: 368, year: 2019, publisher: 'Ballantine Books' },
      { title: 'The Vanishing Half', author: 'Brit Bennett', genre: 'Fiction', pages: 352, year: 2020, publisher: 'Riverhead Books' },
      { title: 'Normal People', author: 'Sally Rooney', genre: 'Romance', pages: 273, year: 2018, publisher: 'Hogarth' },
      { title: 'The Guest List', author: 'Lucy Foley', genre: 'Mystery', pages: 320, year: 2020, publisher: 'William Morrow' },
      { title: 'Malibu Rising', author: 'Taylor Jenkins Reid', genre: 'Fiction', pages: 384, year: 2021, publisher: 'Ballantine Books' },
    ];

    // Movies - regular releases
    const movies = [
      { title: 'The Shawshank Redemption', director: 'Frank Darabont', studio: 'Columbia Pictures', genre: 'Drama', duration: 142, year: 1994, rating: 'R', format: 'Blu-ray' },
      { title: 'The Godfather', director: 'Francis Ford Coppola', studio: 'Paramount Pictures', genre: 'Crime', duration: 175, year: 1972, rating: 'R', format: 'Blu-ray' },
      { title: 'Inception', director: 'Christopher Nolan', studio: 'Warner Bros.', genre: 'Sci-Fi', duration: 148, year: 2010, rating: 'PG-13', format: 'Blu-ray' },
      { title: 'Forrest Gump', director: 'Robert Zemeckis', studio: 'Paramount Pictures', genre: 'Drama', duration: 142, year: 1994, rating: 'PG-13', format: 'DVD' },
      { title: 'The Matrix', director: 'Lana Wachowski, Lilly Wachowski', studio: 'Warner Bros.', genre: 'Sci-Fi', duration: 136, year: 1999, rating: 'R', format: 'Blu-ray' },
      { title: 'Interstellar', director: 'Christopher Nolan', studio: 'Paramount Pictures', genre: 'Sci-Fi', duration: 169, year: 2014, rating: 'PG-13', format: 'Blu-ray' },
      { title: 'The Dark Knight', director: 'Christopher Nolan', studio: 'Warner Bros.', genre: 'Action', duration: 152, year: 2008, rating: 'PG-13', format: 'Blu-ray' },
    ];

    // New release movies (shorter checkout period)
    const new_movies = [
      { title: 'Oppenheimer', director: 'Christopher Nolan', studio: 'Universal Pictures', genre: 'Biography', duration: 180, year: 2023, rating: 'R', format: '4K UHD' },
      { title: 'Barbie', director: 'Greta Gerwig', studio: 'Warner Bros.', genre: 'Comedy', duration: 114, year: 2023, rating: 'PG-13', format: '4K UHD' },
      { title: 'Dune: Part Two', director: 'Denis Villeneuve', studio: 'Warner Bros.', genre: 'Sci-Fi', duration: 166, year: 2024, rating: 'PG-13', format: '4K UHD' },
    ];

    let copy_counter = 1;

    // Create books
    for (let i = 0; i < books.length; i++) {
      const book = books[i];

      // Create library item with uppercase type
      const library_item_id = await create_record('LIBRARY_ITEMS', {
        title: book.title,
        item_type: 'BOOK',  // Uppercase for frontend
        description: `${book.genre} novel by ${book.author}`,
        publication_year: book.year,
        congress_code: `BOOK-${1000 + i}`,
      });

      // Create book details
      await create_record('BOOKS', {
        library_item_id,
        publisher: book.publisher,
        author: book.author,
        genre: book.genre,
        number_of_pages: book.pages,
      });

      // Create item copy - alternate between branches
      const branch_id = (i % 2 === 0) ? 1 : branch2_id;
      await create_record('LIBRARY_ITEM_COPIES', {
        library_item_id,
        owning_branch_id: branch_id,
        return_to_branch_id: branch_id,
        current_branch_id: branch_id,
        condition: 'Good',
        status: 'Available',
        cost: 15.99 + (i * 0.5),
        date_acquired: '2024-01-01',
      });

      console.log(`✓ Created book ${i + 1}/${books.length}: ${book.title}`);
      copy_counter++;
    }

    // Create regular movies
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];

      // Create library item with uppercase type
      const library_item_id = await create_record('LIBRARY_ITEMS', {
        title: movie.title,
        item_type: 'VIDEO',  // Uppercase for frontend
        description: `${movie.genre} film directed by ${movie.director}`,
        publication_year: movie.year,
        congress_code: `VIDEO-${2000 + i}`,
      });

      // Create video details
      await create_record('VIDEOS', {
        library_item_id,
        director: movie.director,
        studio: movie.studio,
        genre: movie.genre,
        duration_minutes: movie.duration,
        format: movie.format,
        rating: movie.rating,
        is_new_release: 0,  // Regular movie
      });

      // Create item copy - alternate between branches
      const branch_id = (i % 2 === 0) ? 1 : branch2_id;
      await create_record('LIBRARY_ITEM_COPIES', {
        library_item_id,
        owning_branch_id: branch_id,
        return_to_branch_id: branch_id,
        current_branch_id: branch_id,
        condition: 'Good',
        status: 'Available',
        cost: 19.99 + (i * 0.5),
        date_acquired: '2024-01-01',
      });

      console.log(`✓ Created movie ${i + 1}/${movies.length}: ${movie.title}`);
      copy_counter++;
    }

    // Create new release movies
    for (let i = 0; i < new_movies.length; i++) {
      const movie = new_movies[i];

      // Create library item with uppercase type
      const library_item_id = await create_record('LIBRARY_ITEMS', {
        title: movie.title,
        item_type: 'VIDEO',  // Still VIDEO type, but marked as new release
        description: `NEW RELEASE - ${movie.genre} film directed by ${movie.director}`,
        publication_year: movie.year,
        congress_code: `VIDEO-NEW-${3000 + i}`,
      });

      // Create video details with is_new_release flag
      await create_record('VIDEOS', {
        library_item_id,
        director: movie.director,
        studio: movie.studio,
        genre: movie.genre,
        duration_minutes: movie.duration,
        format: movie.format,
        rating: movie.rating,
        is_new_release: 1,  // New release flag
      });

      // Create item copy - all at main branch
      await create_record('LIBRARY_ITEM_COPIES', {
        library_item_id,
        owning_branch_id: 1,
        return_to_branch_id: 1,
        current_branch_id: 1,
        condition: 'New',
        status: 'Available',
        cost: 29.99,
        date_acquired: '2024-11-01',
      });

      console.log(`✓ Created NEW RELEASE ${i + 1}/${new_movies.length}: ${movie.title}`);
      copy_counter++;
    }

    console.log('\n👥 Creating 5 test patrons...');

    // Calculate dynamic expiration dates
    const future_expiration = new Date();
    future_expiration.setFullYear(future_expiration.getFullYear() + 2); // 2 years from now
    const future_expiration_str = future_expiration.toISOString().split('T')[0];

    const past_expiration = new Date();
    past_expiration.setMonth(past_expiration.getMonth() - 6); // 6 months ago
    const past_expiration_str = past_expiration.toISOString().split('T')[0];

    // Patron 1: Perfect patron - no issues
    const patron1_id = await create_record('PATRONS', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0100',
      address: '123 Main St, Springfield',
      balance: 0.00,
      birthday: '1990-01-15',
      card_expiration_date: future_expiration_str,
      is_active: 1,
    });
    console.log(`✓ Created Patron 1: John Doe (ID: ${patron1_id}) - Card expires ${future_expiration_str}`);

    // Patron 2: Has fines
    const patron2_id = await create_record('PATRONS', {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-0101',
      address: '456 Oak Ave, Springfield',
      balance: 15.50,  // Has outstanding fines
      birthday: '1985-05-20',
      card_expiration_date: future_expiration_str,
      is_active: 1,
    });
    console.log(`✓ Created Patron 2: Jane Smith (ID: ${patron2_id}) - Has $15.50 in fines`);

    // Patron 3: Expired account
    const patron3_id = await create_record('PATRONS', {
      first_name: 'Robert',
      last_name: 'Johnson',
      email: 'robert.johnson@example.com',
      phone: '555-0102',
      address: '789 Pine Rd, Springfield',
      balance: 0.00,
      birthday: '1975-08-10',
      card_expiration_date: past_expiration_str,  // Expired card
      is_active: 1,
    });
    console.log(`✓ Created Patron 3: Robert Johnson (ID: ${patron3_id}) - Card expired on ${past_expiration_str}`);

    // Patron 4: Has 20 items checked out
    const patron4_id = await create_record('PATRONS', {
      first_name: 'Emily',
      last_name: 'Davis',
      email: 'emily.davis@example.com',
      phone: '555-0103',
      address: '321 Elm St, Springfield',
      balance: 0.00,
      birthday: '1992-03-25',
      card_expiration_date: future_expiration_str,
      is_active: 1,
    });
    console.log(`✓ Created Patron 4: Emily Davis (ID: ${patron4_id}) - Will have 20 items checked out`);

    // Patron 5: Normal patron
    const patron5_id = await create_record('PATRONS', {
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@example.com',
      phone: '555-0104',
      address: '654 Maple Dr, Springfield',
      balance: 0.00,
      birthday: '1988-11-30',
      card_expiration_date: future_expiration_str,
      is_active: 1,
    });
    console.log(`✓ Created Patron 5: Michael Brown (ID: ${patron5_id}) - Normal patron`);

    console.log('\n📖 Checking out 20 items to Patron 4 (Emily Davis)...');

    // Checkout 20 items to patron 4 (mix of books and movies)
    const checkout_date = new Date();
    const due_date = new Date(checkout_date.getTime() + 28 * 24 * 60 * 60 * 1000); // 4 weeks

    for (let i = 1; i <= 20; i++) {
      // Create transaction
      await create_record('TRANSACTIONS', {
        copy_id: i,
        patron_id: patron4_id,
        transaction_type: 'checkout',
        checkout_date,
        due_date,
        status: 'Active',
        fine_amount: 0,
      });

      // Update item copy status
      await execute_query(
        'UPDATE LIBRARY_ITEM_COPIES SET status = ?, checked_out_by = ?, due_date = ? WHERE id = ?',
        ['Checked Out', patron4_id, due_date, i]
      );
    }
    console.log(`✓ Checked out 20 items to Emily Davis`);

    const total_items = books.length + movies.length + new_movies.length;

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n═══════════════════════════════════════════════════');
    console.log('TEST DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🏢 Library Branches:');
    console.log('  • Main Library (ID: 1)');
    console.log(`  • Downtown Branch (ID: ${branch2_id})`);
    console.log('\n📚 Library Inventory:');
    console.log(`  • ${books.length} books (contemporary fiction and classics)`);
    console.log(`  • ${movies.length} movies (classic films)`);
    console.log(`  • ${new_movies.length} new release movies (2023-2024)`);
    console.log(`  • Total: ${total_items} items with copies`);
    console.log('  • Copy IDs 1-20: Checked out to Patron 4');
    console.log(`  • Copy IDs 21-${total_items}: Available for checkout`);
    console.log('\n👥 Test Patrons:');
    console.log('\n  1. John Doe (ID: 1) ✅');
    console.log('     • Status: Active');
    console.log('     • Card: Valid until 2026-12-31');
    console.log('     • Balance: $0.00');
    console.log('     • Items: 0');
    console.log('     • Can checkout: YES');
    console.log('\n  2. Jane Smith (ID: 2) ⚠️');
    console.log('     • Status: Active');
    console.log('     • Card: Valid until 2026-12-31');
    console.log('     • Balance: $15.50 (HAS FINES)');
    console.log('     • Items: 0');
    console.log('     • Can checkout: NO - Must pay fines first');
    console.log('\n  3. Robert Johnson (ID: 3) ❌');
    console.log('     • Status: Active');
    console.log('     • Card: EXPIRED (2024-06-30)');
    console.log('     • Balance: $0.00');
    console.log('     • Items: 0');
    console.log('     • Can checkout: NO - Card expired');
    console.log('\n  4. Emily Davis (ID: 4) 🚫');
    console.log('     • Status: Active');
    console.log('     • Card: Valid until 2026-12-31');
    console.log('     • Balance: $0.00');
    console.log('     • Items: 20 (MAXIMUM LIMIT REACHED)');
    console.log('     • Can checkout: NO - Has 20 items already');
    console.log('\n  5. Michael Brown (ID: 5) ✅');
    console.log('     • Status: Active');
    console.log('     • Card: Valid until 2026-12-31');
    console.log('     • Balance: $0.00');
    console.log('     • Items: 0');
    console.log('     • Can checkout: YES');
    console.log('\n═══════════════════════════════════════════════════');
    console.log('TESTING GUIDE');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Valid Checkouts:');
    console.log(`   • Patron 1 or 5 + Copy 21-${total_items} = Success`);
    console.log('\n📚 Item Types:');
    console.log('   • Books: 4-week checkout period');
    console.log('   • Movies: 1-week checkout period');
    console.log('   • New Releases: 3-day checkout period');
    console.log('\n⚠️  Should Show Fine Warning:');
    console.log('   • Patron 2 (Jane Smith) - Balance: $15.50');
    console.log('\n❌ Should Show Expired Card:');
    console.log('   • Patron 3 (Robert Johnson)');
    console.log('\n🚫 Should Show "Too Many Items" (20 limit):');
    console.log('   • Patron 4 (Emily Davis)');
    console.log('\n📥 Check-In & Reshelve:');
    console.log('   • Items checked in will have status "returned"');
    console.log('   • Use "Mark Items as Available" to reshelve them');
    console.log('   • Reshelving changes status from "returned" to "Available"');
    console.log('\n═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed_database();
