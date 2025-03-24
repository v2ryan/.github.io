-- 创建会员表
CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'guest') NOT NULL DEFAULT 'user',
    registerDate DATETIME NOT NULL
);

-- 创建分数表
CREATE TABLE scores (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    date DATETIME NOT NULL,
    INDEX (score DESC)
);

-- 创建设置表
CREATE TABLE settings (
    name VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL
);

-- 插入默认设置
INSERT INTO settings (name, value) VALUES 
    ('difficulty', 'medium'),
    ('maxScores', '10');

-- 插入默认管理员账户
INSERT INTO members (id, username, password, role, registerDate) VALUES 
    ('admin', 'admin', 'password', 'admin', NOW()); 