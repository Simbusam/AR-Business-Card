-- Reset and recreate core tables for MySQL schema used by this project
-- WARNING: This drops and recreates users/assets tables for the `next_xr` database.

CREATE DATABASE IF NOT EXISTS `next_xr` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `next_xr`;
SET FOREIGN_KEY_CHECKS=0;

-- Drop in safe order to clear any corrupted dictionary entries (#1932)
DROP TABLE IF EXISTS `video_assets`;
DROP TABLE IF EXISTS `image_assets`;
DROP TABLE IF EXISTS `assets`;
DROP TABLE IF EXISTS `users`;

-- Recreate tables to match Backend/db/mysql.js

CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `mongo_user_id` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(255) NULL,
  `name` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `type` ENUM('image','video','3d_model','audio','document') NOT NULL,
  `mime` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `size` BIGINT NOT NULL,
  `url` TEXT NOT NULL,
  `storage_path` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `image_assets` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `mime` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `size` BIGINT NOT NULL,
  `url` TEXT NOT NULL,
  `storage_path` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `video_assets` (
  `id` CHAR(36) NOT NULL PRIMARY KEY,
  `user_id` CHAR(36) NOT NULL,
  `project_id` VARCHAR(64) NULL,
  `mime` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `size` BIGINT NOT NULL,
  `url` TEXT NOT NULL,
  `storage_path` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;
