# Bitshala Admin Panel

A web-based admin dashboard for managing Bitcoin education cohorts at Bitshala. The system helps track student progress, manage TA assignments, and handle weekly data for various Bitcoin development courses.

## Setup and Running

### Quick Start (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bitshala/admin.git
   cd admin
   ```

2. **Make the run script executable and start everything:**
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

The script will automatically handle database setup, install dependencies, and start both servers.

### Manual Setup

If you prefer to run components separately:

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Run database migrations:**
   ```bash
   cargo run --bin migrate BPD
   ```
   > Replace `BPD` with your cohort name (BPD, PB, LBTCL, or MB)

3. **Start the backend server:**
   ```bash
   cargo run
   ```
   Backend will run on `http://localhost:8081`

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## Testing

Run backend tests:
```bash
cd backend
cargo test
```

