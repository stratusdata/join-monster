
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
			  id int PRIMARY KEY,
  email_address VARCHAR(150),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  num_legs int DEFAULT 2,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
			  id int PRIMARY KEY,
  body VARCHAR(1024) NOT NULL,
  post_id int NOT NULL,
  author_id int NOT NULL,
  archived bit DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);
DROP TABLE IF EXISTS posts;
CREATE TABLE posts (
			  id int PRIMARY KEY,
  body VARCHAR(1024) NOT NULL,
  author_id int NOT NULL,
  archived bit DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);
DROP TABLE IF EXISTS relationships;
CREATE TABLE relationships (
			  follower_id int NOT NULL,
  followee_id int NOT NULL,
  closeness VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
  UNIQUE (follower_id, followee_id)
);
DROP TABLE IF EXISTS likes;
CREATE TABLE likes (
			  account_id int NOT NULL,
  comment_id int NOT NULL,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
  UNIQUE (account_id, comment_id)
);
DROP TABLE IF EXISTS sponsors;
CREATE TABLE sponsors (
			  generation int NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  num_legs int DEFAULT 2,
  created_at DATETIME NOT NULL DEFAULT GETUTCDATE()
);