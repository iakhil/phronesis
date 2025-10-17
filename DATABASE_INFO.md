# 🗄️ Phronesis Database Storage

## 📍 Location

All data is stored in a **SQLite database file** located at:

```
/Users/akhilivaturi/dev/phronesis/phronesis.db
```

**Current size**: ~56 KB

## 🗂️ Database Type

**SQLite** - A lightweight, file-based SQL database
- No separate database server needed
- Single file storage
- Fast and efficient for small to medium datasets
- Perfect for development and moderate production use

## 📊 Database Schema

### 1️⃣ **`curriculums` Table**
Stores AI-generated curriculum for Computer Science subtopics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `subtopic` | VARCHAR(255) | Subtopic name (unique, indexed) |
| `curriculum_data` | JSON | Array of curriculum items |
| `created_at` | DATETIME | When curriculum was created |
| `updated_at` | DATETIME | When curriculum was last updated |

**Currently storing**: 4 curriculums
- Data Structures
- Computer Architecture
- Operating Systems
- Computer Networks

**Example data structure**:
```json
{
  "subtopic": "Computer Architecture",
  "curriculum_data": [
    {
      "title": "Fundamentals of Digital Logic",
      "level": "beginner",
      "description": "..."
    },
    {
      "title": "Boolean Algebra and Logic Gates",
      "level": "beginner",
      "description": "..."
    }
  ]
}
```

### 2️⃣ **`scroll_contents` Table**
Caches AI-generated content for the Scroll feed.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `topic` | VARCHAR(255) | Topic name (indexed) |
| `content_type` | VARCHAR(50) | Type: fact, story, question, tip, challenge (indexed) |
| `content` | TEXT | The generated content text |
| `created_at` | DATETIME | When content was created |

**Currently storing**: 4 scroll contents
- Ancient Civilizations (tip, challenge, story)
- Artificial Intelligence (fact)

**Example data**:
```json
{
  "topic": "Artificial Intelligence",
  "content_type": "fact",
  "content": "Did you know that some of the most advanced AI models today weren't entirely designed by humans?...",
  "created_at": "2025-10-11 14:08:00"
}
```

**Cache limit**: Keeps only 5 most recent contents per topic/type combination

### 3️⃣ **`learning_sessions` Table**
Reserved for future use - will track user learning sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key (auto-increment) |
| `subtopic` | VARCHAR(255) | Subtopic name (indexed) |
| `mode` | VARCHAR(50) | 'learn' or 'quiz' |
| `session_data` | JSON | Session-specific data (questions, scores, etc.) |
| `started_at` | DATETIME | When session started |
| `completed_at` | DATETIME | When session completed |

**Currently**: Empty (not yet in use)

**Future use cases**:
- Track quiz scores
- Store learning progress
- Save voice chat history
- Analytics and insights

## 🔧 Database Management

### View Database File
```bash
cd /Users/akhilivaturi/dev/phronesis
ls -lh phronesis.db
```

### Access Database
```bash
sqlite3 phronesis.db
```

### Common Queries

#### View all tables
```sql
.tables
```

#### View table schema
```sql
.schema curriculums
.schema scroll_contents
```

#### Count records
```sql
SELECT COUNT(*) FROM curriculums;
SELECT COUNT(*) FROM scroll_contents;
```

#### View all cached curriculums
```sql
SELECT subtopic, created_at FROM curriculums ORDER BY created_at DESC;
```

#### View all cached scroll content
```sql
SELECT topic, content_type, created_at FROM scroll_contents ORDER BY created_at DESC;
```

#### View specific curriculum
```sql
SELECT curriculum_data FROM curriculums WHERE subtopic = 'Computer Architecture';
```

#### Clear all scroll content cache
```sql
DELETE FROM scroll_contents;
```

#### Clear specific topic cache
```sql
DELETE FROM scroll_contents WHERE topic = 'Artificial Intelligence';
```

#### Clear old scroll content (keep 5 per topic/type)
```sql
-- This is done automatically by the app
-- But you can manually run cleanup if needed
```

## 🔐 Database Security

### Current Setup
- **No password**: SQLite is file-based, secured by file system permissions
- **Access control**: Only readable by the user running the application
- **Location**: In project directory (not web-accessible)

### Production Recommendations
1. **Set proper file permissions**: `chmod 600 phronesis.db`
2. **Move to secure location**: Outside web root
3. **Regular backups**: Automated daily backups
4. **Consider PostgreSQL**: For multi-user production deployments

## 💾 Backup & Restore

### Backup Database
```bash
# Simple copy
cp phronesis.db phronesis.db.backup

# With timestamp
cp phronesis.db phronesis.db.$(date +%Y%m%d_%H%M%S)

# SQLite backup command
sqlite3 phronesis.db ".backup phronesis_backup.db"
```

### Restore Database
```bash
# Restore from backup
cp phronesis.db.backup phronesis.db

# Or restore from SQLite backup
mv phronesis_backup.db phronesis.db
```

### Export to SQL
```bash
sqlite3 phronesis.db .dump > phronesis_backup.sql
```

### Import from SQL
```bash
sqlite3 phronesis.db < phronesis_backup.sql
```

## 📈 Database Size Management

### Current Size
```bash
ls -lh phronesis.db
# Output: ~56 KB
```

### Growth Estimates
- **Curriculums**: ~5-10 KB each → max ~100 KB (10 subtopics)
- **Scroll Contents**: ~1-2 KB each → max ~500 KB (5 per type × 5 types × 20 topics)
- **Total estimated**: < 1 MB for normal use

### Cleanup Strategy
1. **Automatic**: App keeps only 5 scroll contents per topic/type
2. **Manual**: Delete old scroll contents if needed
3. **Vacuum**: Reclaim space after deletions

```bash
sqlite3 phronesis.db "VACUUM;"
```

## 🔄 Migration & Scaling

### When to Migrate to PostgreSQL
Consider if:
- Multiple users accessing simultaneously (>10 concurrent)
- Database size exceeds 1 GB
- Need advanced features (triggers, stored procedures)
- Deploying to production with high traffic

### Migration Path
1. Export SQLite data to JSON
2. Set up PostgreSQL database
3. Update `database.py` connection string
4. Import JSON data to PostgreSQL
5. Update `requirements.txt` with `psycopg2`

## 🛠️ Configuration

### Database URL
Located in `database.py`:
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./phronesis.db"
```

### Change Database Location
```python
# Store in a different location
SQLALCHEMY_DATABASE_URL = "sqlite:////path/to/your/database.db"

# Or use environment variable
import os
DB_PATH = os.environ.get('DATABASE_PATH', './phronesis.db')
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
```

### Use PostgreSQL (Production)
```python
SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/phronesis"
```

## 📊 Database Statistics

### View Statistics
```bash
# Table sizes
sqlite3 phronesis.db "
  SELECT 
    name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as count
  FROM sqlite_master m WHERE type='table';
"

# Index information
sqlite3 phronesis.db ".indexes"

# Database integrity check
sqlite3 phronesis.db "PRAGMA integrity_check;"
```

## 🔍 Monitoring

### Check Database Health
```bash
# Analyze database
sqlite3 phronesis.db "ANALYZE;"

# Check integrity
sqlite3 phronesis.db "PRAGMA integrity_check;"

# View page count
sqlite3 phronesis.db "PRAGMA page_count;"
```

## 📝 Best Practices

### ✅ Do
- Regular backups (daily recommended)
- Monitor database size
- Clean up old data periodically
- Use transactions for bulk operations
- Set proper file permissions

### ❌ Don't
- Commit database file to git (add to `.gitignore`)
- Store sensitive data unencrypted
- Run without backups in production
- Allow direct web access to database file
- Ignore database errors

## 🚨 Troubleshooting

### Database locked
```bash
# Check for processes using the database
lsof phronesis.db

# Or restart the application
```

### Corrupted database
```bash
# Check integrity
sqlite3 phronesis.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp phronesis.db.backup phronesis.db
```

### Database file missing
```bash
# The app will create it automatically on startup
# Just restart the backend
uv run uvicorn app:app --host 0.0.0.0 --port 5000
```

---

**Database Location**: `/Users/akhilivaturi/dev/phronesis/phronesis.db`  
**Current Size**: ~56 KB  
**Tables**: 3 (curriculums, scroll_contents, learning_sessions)  
**Records**: 8 total (4 curriculums, 4 scroll contents)  
**Status**: ✅ Healthy and operational



