-- Create ArticleType enum
CREATE TYPE ArticleType AS ENUM ('NEWS', 'TOURNAMENT_REPORT', 'GENERAL');

-- Create Article table
CREATE TABLE Article (
    article_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt VARCHAR(500),
    type ArticleType NOT NULL DEFAULT 'NEWS',
    author_id INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME,
    
    FOREIGN KEY (author_id) REFERENCES User(user_id) ON DELETE CASCADE,
    
    INDEX idx_article_author (author_id),
    INDEX idx_article_published (published),
    INDEX idx_article_featured (featured),
    INDEX idx_article_created (created_at),
    INDEX idx_article_published_at (published_at)
);
