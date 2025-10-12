-- Add parent_comment_id to Comment table for threaded comments
ALTER TABLE Comment ADD COLUMN parent_comment_id INT NULL;

-- Add foreign key constraint for parent comment
ALTER TABLE Comment ADD CONSTRAINT fk_comment_parent 
  FOREIGN KEY (parent_comment_id) REFERENCES Comment(comment_id) ON DELETE CASCADE;

-- Add index for parent_comment_id
CREATE INDEX idx_comment_parent ON Comment(parent_comment_id);

-- Create Notification table
CREATE TABLE Notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_article_id INT NULL,
    related_comment_id INT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (related_article_id) REFERENCES Article(article_id) ON DELETE CASCADE,
    FOREIGN KEY (related_comment_id) REFERENCES Comment(comment_id) ON DELETE CASCADE,
    
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at)
);
