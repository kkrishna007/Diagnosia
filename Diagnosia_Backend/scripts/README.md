Admin seeding helper

This script creates an `admin` role and a user assigned to it. It is idempotent and safe for local/dev use.

Usage:

  # default admin
  node scripts/seedAdmin.js

  # custom values
  node scripts/seedAdmin.js --email admin@example.com --password MyPass123 --first_name Admin --last_name User --phone +919876543210 --date_of_birth 1980-01-01 --gender male

Notes:
- The script will not overwrite an existing user with the same email; it will attach the admin role if missing.
- For production, prefer an out-of-band user provisioning process and strong passwords.
