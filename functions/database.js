export async function initializeDatabase(env) {
    try {
        // 检查表是否存在
        const tableExists = await checkTableExists(env.DB);
        
        if (!tableExists) {
            // 如果表不存在，则创建表
            await createTables(env.DB);
            console.log('数据库表创建成功');
        }
    } catch (error) {
        console.error('初始化数据库失败:', error);
        throw error;
    }
}

async function checkTableExists(db) {
    try {
        const result = await db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='content_blocks'"
        ).all();
        return result.length > 0;
    } catch (error) {
        console.error('检查表是否存在时出错:', error);
        return false;
    }
}

async function createTables(db) {
    const schema = `
        CREATE TABLE IF NOT EXISTS content_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        await db.prepare(schema).run();
    } catch (error) {
        console.error('创建表时出错:', error);
        throw error;
    }
} 