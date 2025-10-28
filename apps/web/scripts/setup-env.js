const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('Copying env.example to .env...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env from env.example');
  } else {
    console.error('❌ env.example not found');
    process.exit(1);
  }
}

// Read .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Ensure DATABASE_URL is set
if (!envContent.includes('DATABASE_URL=')) {
  envContent += '\nDATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_dev"';
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added DATABASE_URL to .env');
}

console.log('Environment setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Start Docker services: docker-compose -f infra/docker-compose.dev.yml up -d');
console.log('2. Run migrations: pnpm prisma migrate dev');
console.log('3. Seed database: pnpm db:seed');
console.log('4. Start dev server: pnpm dev');

