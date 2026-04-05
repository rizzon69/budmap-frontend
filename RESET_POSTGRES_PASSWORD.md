# Reset PostgreSQL Password - Instructions

## Method 1: Using pgAdmin (Easiest)

1. Open pgAdmin 4
2. Right-click on "PostgreSQL" server
3. Click "Properties"
4. Go to "Connection" tab
5. You'll see the password field - but you can't view it

If this doesn't work, use Method 2:

## Method 2: Reset Password via Command Line

### Step 1: Find pg_hba.conf file
Usually located at: C:\Program Files\PostgreSQL\{version}\data\pg_hba.conf

### Step 2: Edit pg_hba.conf
1. Open as Administrator
2. Find this line:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
3. Change to:
   ```
   host    all             all             127.0.0.1/32            trust
   ```

### Step 3: Restart PostgreSQL
1. Open Services (Win + R, type: services.msc)
2. Find "postgresql-x64-{version}"
3. Right-click → Restart

### Step 4: Change Password
```bash
psql -U postgres
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q
```

### Step 5: Revert pg_hba.conf
Change back from "trust" to "scram-sha-256"

### Step 6: Restart PostgreSQL Again

## Method 3: Simple Password Reset (Windows)

1. Open Command Prompt as Administrator
2. Navigate to PostgreSQL bin folder:
   ```
   cd "C:\Program Files\PostgreSQL\16\bin"
   ```
3. Run:
   ```
   psql -U postgres
   ```
4. If it asks for password and you don't know it, use Method 2 above.

## After Resetting Password

Update your .env file:
```
DB_PASSWORD=your_new_password
```

Then run:
```
npm run migrate
```
