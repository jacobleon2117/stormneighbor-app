-- Migration: Add messaging system tables

-- Create conversations table for direct messages
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
    
    CONSTRAINT conversations_participants_different CHECK (participant_1_id != participant_2_id),
    UNIQUE(participant_1_id, participant_2_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    images TEXT[], -- Array of image URLs
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- Add foreign key constraint to conversations.last_message_id after messages table is created
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message 
    FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Function to update conversation after message insert
CREATE OR REPLACE FUNCTION update_conversation_after_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update conversation with new message info
    UPDATE conversations 
    SET 
        last_message_id = NEW.id,
        last_message_at = NEW.created_at,
        participant_1_unread_count = CASE 
            WHEN participant_1_id = NEW.recipient_id THEN participant_1_unread_count + 1 
            ELSE participant_1_unread_count 
        END,
        participant_2_unread_count = CASE 
            WHEN participant_2_id = NEW.recipient_id THEN participant_2_unread_count + 1 
            ELSE participant_2_unread_count 
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation when message is added
CREATE TRIGGER trigger_update_conversation_after_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_after_message();

-- Function to update unread count when message is read
CREATE OR REPLACE FUNCTION update_conversation_read_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if message is being marked as read
    IF OLD.is_read = false AND NEW.is_read = true THEN
        UPDATE conversations 
        SET 
            participant_1_unread_count = CASE 
                WHEN participant_1_id = NEW.recipient_id THEN 
                    GREATEST(participant_1_unread_count - 1, 0)
                ELSE participant_1_unread_count 
            END,
            participant_2_unread_count = CASE 
                WHEN participant_2_id = NEW.recipient_id THEN 
                    GREATEST(participant_2_unread_count - 1, 0)
                ELSE participant_2_unread_count 
            END,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation when message read status changes
CREATE TRIGGER trigger_update_conversation_read_status
    AFTER UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_read_status();