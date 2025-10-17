-- Migration to remove unique constraint on MegaschaakTeam (user_id, tournament_id)
-- This allows users to create multiple teams per tournament

-- Step 1: Create separate index on user_id
-- This ensures the foreign key on user_id still has an index after dropping the unique constraint
CREATE INDEX `MegaschaakTeam_user_id_idx` ON `MegaschaakTeam`(`user_id`);

-- Step 2: Drop the unique constraint
-- Now that we have a separate index, we can safely drop the unique constraint
ALTER TABLE `MegaschaakTeam` DROP INDEX `MegaschaakTeam_user_id_tournament_id_key`;

