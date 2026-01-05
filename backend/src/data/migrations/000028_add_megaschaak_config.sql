-- Migration to add megaschaak_config field to Tournament table
-- This allows admins to configure the megaschaak formula parameters per tournament

ALTER TABLE `Tournament` ADD COLUMN `megaschaak_config` JSON NULL;

