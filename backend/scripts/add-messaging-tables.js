const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createMessagingTables = async () => {
  const client = await pool.connect();

  try {
    console.log('Creating conversations and messages tables...');

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          participant_1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          participant_2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          last_message_id INTEGER,
          last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          participant_1_unread_count INTEGER DEFAULT 0,
          participant_2_unread_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

          UNIQUE(participant_1_id, participant_2_id),
          CHECK (participant_1_id < participant_2_id)
      );
    `);

    console.log('✅ Conversations table created');

    // Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'text',
          images TEXT[],
          is_read BOOLEAN DEFAULT FALSE,
          read_at TIMESTAMP WITH TIME ZONE,
          is_edited BOOLEAN DEFAULT FALSE,
          edited_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Messages table created');

    // Add foreign key constraint
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'fk_conversations_last_message'
          ) THEN
              ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message
                  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;
          END IF;
      END $$;
    `);

    console.log('✅ Foreign key constraint added');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participant_1_id, participant_2_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversations_unread ON conversations(participant_1_unread_count, participant_2_unread_count) WHERE participant_1_unread_count > 0 OR participant_2_unread_count > 0;

      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;
    `);

    console.log('✅ Indexes created');

    // Create triggers
    await client.query(`
      CREATE OR REPLACE FUNCTION update_conversation_on_message()
      RETURNS TRIGGER AS $$
      BEGIN
          UPDATE conversations
          SET
              last_message_id = NEW.id,
              last_message_at = NEW.created_at,
              participant_1_unread_count = CASE
                  WHEN NEW.recipient_id = participant_1_id THEN participant_1_unread_count + 1
                  ELSE participant_1_unread_count
              END,
              participant_2_unread_count = CASE
                  WHEN NEW.recipient_id = participant_2_id THEN participant_2_unread_count + 1
                  ELSE participant_2_unread_count
              END,
              updated_at = NOW()
          WHERE id = NEW.conversation_id;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
      CREATE TRIGGER trigger_update_conversation_on_message
          AFTER INSERT ON messages
          FOR EACH ROW
          EXECUTE FUNCTION update_conversation_on_message();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_conversation_unread_on_read()
      RETURNS TRIGGER AS $$
      BEGIN
          IF OLD.is_read = false AND NEW.is_read = true THEN
              UPDATE conversations
              SET
                  participant_1_unread_count = CASE
                      WHEN NEW.recipient_id = participant_1_id AND participant_1_unread_count > 0
                      THEN participant_1_unread_count - 1
                      ELSE participant_1_unread_count
                  END,
                  participant_2_unread_count = CASE
                      WHEN NEW.recipient_id = participant_2_id AND participant_2_unread_count > 0
                      THEN participant_2_unread_count - 1
                      ELSE participant_2_unread_count
                  END,
                  updated_at = NOW()
              WHERE id = NEW.conversation_id;
          END IF;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_conversation_unread_on_read ON messages;
      CREATE TRIGGER trigger_update_conversation_unread_on_read
          AFTER UPDATE ON messages
          FOR EACH ROW
          EXECUTE FUNCTION update_conversation_unread_on_read();
    `);

    console.log('✅ Triggers created');

    // Test the tables
    const testResult = await client.query(`
      SELECT
          COUNT(*) as conversation_count
      FROM conversations;
    `);

    const testResult2 = await client.query(`
      SELECT
          COUNT(*) as message_count
      FROM messages;
    `);

    console.log('✅ Database migration completed successfully!');
    console.log(`📊 Current conversations: ${testResult.rows[0].conversation_count}`);
    console.log(`📊 Current messages: ${testResult2.rows[0].message_count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
createMessagingTables()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });