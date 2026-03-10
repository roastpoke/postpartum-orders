const cloudbase = require('@cloudbase/node-sdk');
const config = require('../../cloudbase.config.js');

// 初始化CloudBase
const app = cloudbase.init({
  env: config.env
});

const db = app.database();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    const { userId, role, statusFilter, dateFilter } = req.body;

    // 构建查询条件
    let query = db.collection('orders');

    // 权限过滤：员工只能看自己的，主管可以看所有
    if (role !== 'admin') {
      query = query.where({ createdBy: userId });
    }

    // 状态筛选
    if (statusFilter) {
      query = query.where({ status: statusFilter });
    }

    // 时间筛选
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dateFilter === 'today') {
        query = query.where({ createdAt: db.command.gte(today.toISOString()) });
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.where({ createdAt: db.command.gte(weekAgo.toISOString()) });
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.where({ createdAt: db.command.gte(monthAgo.toISOString()) });
      }
    }

    // 执行查询（按创建时间倒序）
    const result = await query.orderBy('createdAt', 'desc').get();

    res.status(200).json({
      success: true,
      orders: result.data
    });

  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}
