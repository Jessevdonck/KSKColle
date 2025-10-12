-- Create Comment table
CREATE TABLE Comment (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (article_id) REFERENCES Article(article_id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES User(user_id) ON DELETE CASCADE,
    
    INDEX idx_comment_article (article_id),
    INDEX idx_comment_author (author_id),
    INDEX idx_comment_created (created_at)
);
