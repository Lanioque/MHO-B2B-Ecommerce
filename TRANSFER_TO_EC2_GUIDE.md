# Transferring Private GitHub Repository to EC2

Since your repository is private, here are the best methods to transfer your code to EC2:

## Method 1: Clone Directly on EC2 (Recommended)

This is the cleanest method and allows for easy updates via `git pull`.

### Option A: Using SSH Keys (Most Secure)

**Step 1: Generate SSH Key on EC2 (if you don't have one)**

```bash
# SSH into your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip

# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter to accept default location
# Optionally set a passphrase

# Display the public key
cat ~/.ssh/id_ed25519.pub
```

**Step 2: Add SSH Key to GitHub**

1. Copy the public key from EC2 (output of `cat ~/.ssh/id_ed25519.pub`)
2. Go to GitHub → Settings → SSH and GPG keys
3. Click "New SSH key"
4. Paste the key and save

**Step 3: Clone Repository on EC2**

```bash
# Test SSH connection to GitHub
ssh -T git@github.com
# You should see: "Hi Lanioque! You've successfully authenticated..."

# Clone the repository
cd /var/www
git clone git@github.com:Lanioque/MHO-B2B-Ecommerce.git mho
cd mho
```

### Option B: Using GitHub Personal Access Token (Alternative)

**Step 1: Create Personal Access Token on GitHub**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name it (e.g., "EC2 Deployment")
4. Select scopes: `repo` (full control of private repositories)
5. Generate token and **copy it** (you won't see it again!)

**Step 2: Clone Repository on EC2**

```bash
cd /var/www
git clone https://YOUR_TOKEN@github.com/Lanioque/MHO-B2B-Ecommerce.git mho
cd mho

# Store credentials (optional, for future pulls)
git config credential.helper store
```

**Note:** Replace `YOUR_TOKEN` with your actual token. After first use, Git will cache credentials.

### Option C: Using Deploy Key (Most Secure for Single Repository)

**Step 1: Generate Deploy Key on EC2**

```bash
ssh-keygen -t ed25519 -C "ec2-deploy-key" -f ~/.ssh/mho_deploy_key
cat ~/.ssh/mho_deploy_key.pub
```

**Step 2: Add Deploy Key to GitHub**

1. Copy the public key (`mho_deploy_key.pub`)
2. Go to your repository → Settings → Deploy keys
3. Click "Add deploy key"
4. Paste the key and check "Allow write access" if you want to push
5. Save

**Step 3: Configure SSH and Clone**

```bash
# Create SSH config
nano ~/.ssh/config
```

Add:

```
Host github-mho
    HostName github.com
    User git
    IdentityFile ~/.ssh/mho_deploy_key
    IdentitiesOnly yes
```

```bash
# Clone using the SSH config
cd /var/www
git clone git@github-mho:Lanioque/MHO-B2B-Ecommerce.git mho
cd mho
```

## Method 2: Transfer via SCP/RSYNC (From Local Machine)

If you prefer to upload from your local machine:

### Option A: Using SCP (Simple Copy)

```bash
# From your LOCAL machine (not EC2), run:
scp -i /path/to/your-key.pem -r \
  /Users/alexn/Documents/GitHub/MHO \
  ubuntu@your-ec2-ip:/var/www/mho
```

**Note:** This copies everything including `node_modules`, which is inefficient.

### Option B: Using RSYNC (Better - Excludes node_modules)

```bash
# From your LOCAL machine, run:
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'coverage' \
  --exclude 'playwright-report' \
  --exclude 'test-results' \
  --exclude '.env*' \
  -e "ssh -i /path/to/your-key.pem" \
  /Users/alexn/Documents/GitHub/MHO/ \
  ubuntu@your-ec2-ip:/var/www/mho/
```

**Note:** You'll need to install dependencies on EC2 after transfer.

### Option C: Create Tarball and Transfer

```bash
# On LOCAL machine - create archive excluding unnecessary files
cd /Users/alexn/Documents/GitHub/MHO
tar -czf ../mho-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='coverage' \
  --exclude='playwright-report' \
  --exclude='test-results' \
  --exclude='.env*' \
  --exclude='*.log' \
  .

# Transfer to EC2
scp -i /path/to/your-key.pem \
  ../mho-deploy.tar.gz \
  ubuntu@your-ec2-ip:/var/www/

# On EC2 - extract
ssh -i /path/to/your-key.pem ubuntu@your-ec2-ip
cd /var/www
tar -xzf mho-deploy.tar.gz -C mho
rm mho-deploy.tar.gz
```

## Method 3: Automated Script (Best for Updates)

Create a deployment script that handles the transfer:

### On Local Machine: `deploy-to-ec2.sh`

```bash
#!/bin/bash

# Configuration
EC2_HOST="your-ec2-ip"
EC2_USER="ubuntu"
EC2_KEY="/path/to/your-key.pem"
REMOTE_DIR="/var/www/mho"
LOCAL_DIR="/Users/alexn/Documents/GitHub/MHO"

echo "🚀 Starting deployment to EC2..."

# Check if repository is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes!"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push to GitHub first (recommended)
echo "📤 Pushing to GitHub..."
git push origin master

# SSH into EC2 and pull latest
echo "📥 Pulling latest code on EC2..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << 'ENDSSH'
cd /var/www/mho
git pull origin master
cd apps/web
pnpm install
NODE_ENV=production pnpm build
npx prisma migrate deploy
pm2 restart mho-web
ENDSSH

echo "✅ Deployment complete!"
```

Make it executable:

```bash
chmod +x deploy-to-ec2.sh
```

## Method 4: GitHub Actions (CI/CD)

For automated deployments, set up GitHub Actions:

### Create `.github/workflows/deploy.yml`

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/mho
            git pull origin master
            cd apps/web
            pnpm install
            NODE_ENV=production pnpm build
            npx prisma migrate deploy
            pm2 restart mho-web
```

Add secrets in GitHub:
- `EC2_HOST`: Your EC2 IP or domain
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: Your private SSH key content

## Recommended Setup Workflow

**Initial Setup (One Time):**

1. **On EC2:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "ec2-deploy"

# Display public key
cat ~/.ssh/id_ed25519.pub
```

2. **On GitHub:**
   - Add SSH key as Deploy Key (repository → Settings → Deploy keys)

3. **On EC2:**
```bash
# Create app directory
sudo mkdir -p /var/www/mho
sudo chown -R $USER:$USER /var/www/mho

# Clone repository
cd /var/www
git clone git@github.com:Lanioque/MHO-B2B-Ecommerce.git mho
cd mho

# Install dependencies
pnpm install

# Setup environment
cd apps/web
cp env.example .env.production
nano .env.production  # Edit with production values
```

**Regular Updates:**

After initial setup, just pull updates:

```bash
# On EC2
cd /var/www/mho
git pull origin master
cd apps/web
pnpm install
pnpm build
npx prisma migrate deploy
pm2 restart mho-web
```

## Troubleshooting

### "Permission denied (publickey)" error

```bash
# Test SSH connection
ssh -T git@github.com

# If fails, check key permissions
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### "Repository not found" error

- Verify SSH key is added to GitHub
- Check repository name is correct
- Ensure deploy key has correct permissions

### Large file transfer issues

```bash
# Increase SSH timeout
scp -o ServerAliveInterval=60 -i key.pem file.tar.gz user@host:/path/
```

## Security Best Practices

1. **Never commit `.env` files** - Always use `.env.production` on server
2. **Use deploy keys** instead of personal tokens when possible
3. **Restrict SSH key permissions:**
```bash
chmod 600 ~/.ssh/id_ed25519
```
4. **Use SSH keys** instead of passwords
5. **Rotate keys periodically**

## Quick Reference Commands

```bash
# Clone private repo (SSH)
git clone git@github.com:Lanioque/MHO-B2B-Ecommerce.git

# Clone private repo (HTTPS with token)
git clone https://TOKEN@github.com/Lanioque/MHO-B2B-Ecommerce.git

# Transfer folder (exclude node_modules)
rsync -avz --exclude 'node_modules' -e "ssh -i key.pem" ./ ubuntu@host:/var/www/mho/

# SSH and pull updates
ssh -i key.pem ubuntu@host "cd /var/www/mho && git pull"
```

---

**Recommendation:** Use **Method 1 - Option C (Deploy Key)** for the most secure and efficient setup, or **Method 3 (Automated Script)** if you want to automate deployments from your local machine.

